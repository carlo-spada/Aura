from __future__ import annotations

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, LargeBinary, String, Text, UniqueConstraint
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

