from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Time, Date
from sqlalchemy.orm import relationship
from ..core.database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True) # Nullable for OAuth users
    full_name = Column(String)
    auth_provider = Column(String, default="email") # email, google
    google_id = Column(String, unique=True, index=True, nullable=True)
    goals = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    habits = relationship("Habit", back_populates="owner")
    schedules = relationship("Schedule", back_populates="owner")
    learning_logs = relationship("LearningLog", back_populates="owner")
    tasks = relationship("Task", back_populates="owner")
    notes = relationship("Note", back_populates="owner")

class Habit(Base):
    __tablename__ = "habits"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    streak = Column(Integer, default=0)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="habits")
    logs = relationship("DailyTrackingLog", primaryjoin="and_(Habit.id==foreign(DailyTrackingLog.item_id), DailyTrackingLog.item_type=='Habit')", overlaps="logs")

class DailyTrackingLog(Base):
    __tablename__ = "daily_tracking_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    item_type = Column(String, index=True) # "Habit", "Task", "Schedule", "Learning"
    item_id = Column(Integer, index=True)
    date = Column(Date, default=datetime.utcnow().date())
    status = Column(String, default="Pending") # "Completed", "Not Completed", "Pending"
    notes = Column(Text, nullable=True)
    
    owner = relationship("User")

class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    category = Column(String) # Work, Learning, Health, Personal
    user_id = Column(Integer, ForeignKey("users.id"))
    day_of_week = Column(Integer) # Optional: 0-6
    schedule_date = Column(Date, nullable=True) # Specific date
    description = Column(Text, nullable=True) # Added for unified optional notes

    owner = relationship("User", back_populates="schedules")
    logs = relationship("DailyTrackingLog", primaryjoin="and_(Schedule.id==foreign(DailyTrackingLog.item_id), DailyTrackingLog.item_type=='Schedule')", overlaps="logs")

class LearningLog(Base):
    __tablename__ = "learning_logs"

    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String, nullable=False)
    duration = Column(Integer, nullable=False) # minutes
    category = Column(String)
    notes = Column(Text)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="learning_logs")
    logs = relationship("DailyTrackingLog", primaryjoin="and_(LearningLog.id==foreign(DailyTrackingLog.item_id), DailyTrackingLog.item_type=='Learning')", overlaps="logs")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True) # Added for unified features
    priority = Column(Integer, default=1) # 1: Low, 2: Medium, 3: High
    due_date = Column(DateTime)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="tasks")
    logs = relationship("DailyTrackingLog", primaryjoin="and_(Task.id==foreign(DailyTrackingLog.item_id), DailyTrackingLog.item_type=='Task')", overlaps="logs")

class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    color = Column(String, default="#ffffff")
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="notes")

