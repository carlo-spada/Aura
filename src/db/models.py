from __future__ import annotations

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, LargeBinary, String, Text, UniqueConstraint, JSON
from sqlalchemy.orm import declarative_base, relationship


Base = declarative_base()


class Job(Base):
    __tablename__ = "jobs"
    __table_args__ = (UniqueConstraint("url", name="uq_jobs_url"),)

    id = Column(Integer, primary_key=True)
    title = Column(String)
    company = Column(String)
    location = Column(String, nullable=True)
    salary_min = Column(Float, nullable=True)
    salary_max = Column(Float, nullable=True)
    currency = Column(String, nullable=True)
    description = Column(Text)
    url = Column(String, nullable=False)
    # store ISO string for portability across SQLite/Postgres for now
    date_posted = Column(String, nullable=True)
    embedding = Column(LargeBinary, nullable=True)

    ratings = relationship("Rating", back_populates="job", cascade="all, delete-orphan")
    outcomes = relationship("Outcome", back_populates="job", cascade="all, delete-orphan")


class Rating(Base):
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    stars = Column(Integer, nullable=True)
    fit_score = Column(Integer)
    interest_score = Column(Integer)
    prestige_score = Column(Integer)
    location_score = Column(Integer)
    comment = Column(Text, nullable=True)
    timestamp = Column(DateTime)

    job = relationship("Job", back_populates="ratings")


class Outcome(Base):
    __tablename__ = "outcomes"

    id = Column(Integer, primary_key=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    stage = Column(String)
    reward = Column(Float)
    timestamp = Column(DateTime)

    job = relationship("Job", back_populates="outcomes")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=True)
    sub = Column(String, unique=True, nullable=True)  # auth provider subject
    name = Column(String, nullable=True)
    created_at = Column(DateTime)


class Preferences(Base):
    __tablename__ = "preferences"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    roles = Column(JSON, nullable=True)
    experience = Column(String, nullable=True)
    location_mode = Column(String, nullable=True)  # remote/hybrid/on-site
    location_text = Column(String, nullable=True)
    include_skills = Column(JSON, nullable=True)
    exclude_skills = Column(JSON, nullable=True)
    company_types = Column(JSON, nullable=True)
    batch_size = Column(Integer, nullable=True)
    frequency_days = Column(Integer, nullable=True)
    cv_url = Column(String, nullable=True)


class Batch(Base):
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime)
    locked_at = Column(DateTime, nullable=True)


class BatchJob(Base):
    __tablename__ = "batch_jobs"

    id = Column(Integer, primary_key=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
