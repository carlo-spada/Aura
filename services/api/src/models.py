from __future__ import annotations

from sqlalchemy import String, Integer, Float, Text, ForeignKey
from sqlalchemy.types import JSON
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source: Mapped[str] = mapped_column(String(50), index=True)
    external_id: Mapped[str] = mapped_column(String(255), index=True)
    title: Mapped[str] = mapped_column(String(255), index=True)
    company: Mapped[str] = mapped_column(String(255), index=True)
    location: Mapped[str] = mapped_column(String(255), default="")
    url: Mapped[str] = mapped_column(String(512))
    salary_min: Mapped[float | None] = mapped_column(Float, nullable=True)
    salary_max: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_estimated: Mapped[bool] = mapped_column(Integer, default=0)  # 0/1
    description: Mapped[str] = mapped_column(Text)
    posted_ts: Mapped[int | None] = mapped_column(Integer, nullable=True)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    clerk_id: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[int] = mapped_column(Integer)


class Preference(Base):
    __tablename__ = "preferences"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    roles: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)
    locations: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)
    industries: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)
    min_salary: Mapped[float | None] = mapped_column(Float, nullable=True)
    remote_weight: Mapped[float | None] = mapped_column(Float, nullable=True)
    updated_at: Mapped[int] = mapped_column(Integer)


class Qualification(Base):
    __tablename__ = "qualifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    structured_cv: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)
    updated_at: Mapped[int] = mapped_column(Integer)


class Rating(Base):
    __tablename__ = "ratings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    job_key: Mapped[str] = mapped_column(String(255), index=True)
    stars: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[int] = mapped_column(Integer)
    updated_at: Mapped[int] = mapped_column(Integer)


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    job_key: Mapped[str] = mapped_column(String(255), index=True)
    user_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(64))
    status_history: Mapped[list | dict | None] = mapped_column(JSON, nullable=True)
    generated_docs: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[int] = mapped_column(Integer)
