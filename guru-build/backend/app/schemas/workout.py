"""Workout schemas for API validation."""

from pydantic import BaseModel, field_serializer
from typing import Optional, List
from datetime import datetime
from uuid import UUID


# Exercise Schemas
class ExerciseBase(BaseModel):
    """Base exercise schema."""
    name: str
    sets: Optional[str] = None
    reps: Optional[str] = None
    duration: Optional[str] = None
    order: int = 0


class ExerciseCreate(ExerciseBase):
    """Schema for creating an exercise."""
    pass


class ExerciseUpdate(BaseModel):
    """Schema for updating an exercise."""
    name: Optional[str] = None
    sets: Optional[str] = None
    reps: Optional[str] = None
    duration: Optional[str] = None
    order: Optional[int] = None


class Exercise(ExerciseBase):
    """Full exercise schema with database fields."""
    id: UUID
    section_id: UUID
    created_at: datetime
    updated_at: datetime

    @field_serializer('id', 'section_id')
    def serialize_uuid(self, value: UUID) -> str:
        """Convert UUID to string for JSON serialization."""
        return str(value)

    class Config:
        from_attributes = True


# WorkoutSection Schemas
class WorkoutSectionBase(BaseModel):
    """Base workout section schema."""
    title: str
    order: int = 0


class WorkoutSectionCreate(WorkoutSectionBase):
    """Schema for creating a workout section."""
    exercises: List[ExerciseCreate] = []


class WorkoutSectionUpdate(BaseModel):
    """Schema for updating a workout section."""
    title: Optional[str] = None
    order: Optional[int] = None


class WorkoutSection(WorkoutSectionBase):
    """Full workout section schema with database fields."""
    id: UUID
    workout_id: UUID
    created_at: datetime
    updated_at: datetime
    exercises: List[Exercise] = []

    @field_serializer('id', 'workout_id')
    def serialize_uuid(self, value: UUID) -> str:
        """Convert UUID to string for JSON serialization."""
        return str(value)

    class Config:
        from_attributes = True


# Workout Schemas
class WorkoutBase(BaseModel):
    """Base workout schema."""
    title: str
    description: Optional[str] = None
    completed: bool = False


class WorkoutCreate(WorkoutBase):
    """Schema for creating a workout."""
    sections: List[WorkoutSectionCreate] = []


class WorkoutUpdate(BaseModel):
    """Schema for updating a workout."""
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None


class Workout(WorkoutBase):
    """Full workout schema with database fields."""
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    sections: List[WorkoutSection] = []

    @field_serializer('id', 'user_id')
    def serialize_uuid(self, value: UUID) -> str:
        """Convert UUID to string for JSON serialization."""
        return str(value)

    class Config:
        from_attributes = True
