"""Service for managing workouts, sections, and exercises."""

from sqlalchemy.orm import Session, joinedload
from typing import List
from uuid import UUID
from ..models.workout import Workout
from ..models.workout_section import WorkoutSection
from ..models.exercise import Exercise
from ..schemas.workout import (
    WorkoutCreate, WorkoutUpdate,
    WorkoutSectionCreate, WorkoutSectionUpdate,
    ExerciseCreate, ExerciseUpdate
)


# Workout CRUD operations
def get_workouts(db: Session, user_id: UUID) -> List[Workout]:
    """Get all workouts for a user with sections and exercises."""
    return db.query(Workout).filter(
        Workout.user_id == user_id
    ).options(
        joinedload(Workout.sections).joinedload(WorkoutSection.exercises)
    ).order_by(Workout.created_at).all()


def get_workout(db: Session, workout_id: UUID, user_id: UUID) -> Workout:
    """Get a specific workout with sections and exercises."""
    workout = db.query(Workout).filter(
        Workout.id == workout_id,
        Workout.user_id == user_id
    ).options(
        joinedload(Workout.sections).joinedload(WorkoutSection.exercises)
    ).first()

    if not workout:
        raise ValueError("Workout not found")

    return workout


def create_workout(db: Session, workout: WorkoutCreate, user_id: UUID) -> Workout:
    """Create a new workout with sections and exercises."""
    db_workout = Workout(
        user_id=user_id,
        title=workout.title,
        description=workout.description,
        completed=workout.completed
    )
    db.add(db_workout)
    db.flush()  # Get the workout ID without committing

    # Create sections and exercises
    for section_data in workout.sections:
        db_section = WorkoutSection(
            workout_id=db_workout.id,
            title=section_data.title,
            order=section_data.order
        )
        db.add(db_section)
        db.flush()  # Get the section ID

        # Create exercises for this section
        for exercise_data in section_data.exercises:
            db_exercise = Exercise(
                section_id=db_section.id,
                name=exercise_data.name,
                sets=exercise_data.sets,
                reps=exercise_data.reps,
                duration=exercise_data.duration,
                order=exercise_data.order
            )
            db.add(db_exercise)

    db.commit()
    db.refresh(db_workout)
    return db_workout


def update_workout(db: Session, workout_id: UUID, workout: WorkoutUpdate, user_id: UUID) -> Workout:
    """Update a workout."""
    db_workout = db.query(Workout).filter(
        Workout.id == workout_id,
        Workout.user_id == user_id
    ).first()

    if not db_workout:
        raise ValueError("Workout not found")

    if workout.title is not None:
        db_workout.title = workout.title
    if workout.description is not None:
        db_workout.description = workout.description
    if workout.completed is not None:
        db_workout.completed = workout.completed

    db.commit()
    db.refresh(db_workout)
    return db_workout


def delete_workout(db: Session, workout_id: UUID, user_id: UUID) -> bool:
    """Delete a workout (cascade deletes sections and exercises)."""
    db_workout = db.query(Workout).filter(
        Workout.id == workout_id,
        Workout.user_id == user_id
    ).first()

    if not db_workout:
        return False

    db.delete(db_workout)
    db.commit()
    return True


# WorkoutSection CRUD operations
def create_section(db: Session, workout_id: UUID, section: WorkoutSectionCreate, user_id: UUID) -> WorkoutSection:
    """Create a new section in a workout."""
    # Verify workout belongs to user
    workout = db.query(Workout).filter(
        Workout.id == workout_id,
        Workout.user_id == user_id
    ).first()

    if not workout:
        raise ValueError("Workout not found")

    db_section = WorkoutSection(
        workout_id=workout_id,
        title=section.title,
        order=section.order
    )
    db.add(db_section)
    db.flush()

    # Create exercises for this section
    for exercise_data in section.exercises:
        db_exercise = Exercise(
            section_id=db_section.id,
            name=exercise_data.name,
            sets=exercise_data.sets,
            reps=exercise_data.reps,
            duration=exercise_data.duration,
            order=exercise_data.order
        )
        db.add(db_exercise)

    db.commit()
    db.refresh(db_section)
    return db_section


def update_section(db: Session, section_id: UUID, section: WorkoutSectionUpdate, user_id: UUID) -> WorkoutSection:
    """Update a workout section."""
    # Verify section belongs to user's workout
    db_section = db.query(WorkoutSection).join(Workout).filter(
        WorkoutSection.id == section_id,
        Workout.user_id == user_id
    ).first()

    if not db_section:
        raise ValueError("Section not found")

    if section.title is not None:
        db_section.title = section.title
    if section.order is not None:
        db_section.order = section.order

    db.commit()
    db.refresh(db_section)
    return db_section


def delete_section(db: Session, section_id: UUID, user_id: UUID) -> bool:
    """Delete a workout section (cascade deletes exercises)."""
    # Verify section belongs to user's workout
    db_section = db.query(WorkoutSection).join(Workout).filter(
        WorkoutSection.id == section_id,
        Workout.user_id == user_id
    ).first()

    if not db_section:
        return False

    db.delete(db_section)
    db.commit()
    return True


# Exercise CRUD operations
def create_exercise(db: Session, section_id: UUID, exercise: ExerciseCreate, user_id: UUID) -> Exercise:
    """Create a new exercise in a section."""
    # Verify section belongs to user's workout
    section = db.query(WorkoutSection).join(Workout).filter(
        WorkoutSection.id == section_id,
        Workout.user_id == user_id
    ).first()

    if not section:
        raise ValueError("Section not found")

    db_exercise = Exercise(
        section_id=section_id,
        name=exercise.name,
        sets=exercise.sets,
        reps=exercise.reps,
        duration=exercise.duration,
        order=exercise.order
    )
    db.add(db_exercise)
    db.commit()
    db.refresh(db_exercise)
    return db_exercise


def update_exercise(db: Session, exercise_id: UUID, exercise: ExerciseUpdate, user_id: UUID) -> Exercise:
    """Update an exercise."""
    # Verify exercise belongs to user's workout
    db_exercise = db.query(Exercise).join(WorkoutSection).join(Workout).filter(
        Exercise.id == exercise_id,
        Workout.user_id == user_id
    ).first()

    if not db_exercise:
        raise ValueError("Exercise not found")

    if exercise.name is not None:
        db_exercise.name = exercise.name
    if exercise.sets is not None:
        db_exercise.sets = exercise.sets
    if exercise.reps is not None:
        db_exercise.reps = exercise.reps
    if exercise.duration is not None:
        db_exercise.duration = exercise.duration
    if exercise.order is not None:
        db_exercise.order = exercise.order

    db.commit()
    db.refresh(db_exercise)
    return db_exercise


def delete_exercise(db: Session, exercise_id: UUID, user_id: UUID) -> bool:
    """Delete an exercise."""
    # Verify exercise belongs to user's workout
    db_exercise = db.query(Exercise).join(WorkoutSection).join(Workout).filter(
        Exercise.id == exercise_id,
        Workout.user_id == user_id
    ).first()

    if not db_exercise:
        return False

    db.delete(db_exercise)
    db.commit()
    return True
