"""Routes for workout management."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from ..database import get_db
from ..schemas.workout import (
    Workout, WorkoutCreate, WorkoutUpdate,
    WorkoutSection, WorkoutSectionCreate, WorkoutSectionUpdate,
    Exercise, ExerciseCreate, ExerciseUpdate
)
from ..services import workout_service
from ..models.user import User
from ..services.auth_service import get_current_user

router = APIRouter()


# Workout endpoints
@router.get("/", response_model=List[Workout])
def get_workouts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all workouts for the current user."""
    return workout_service.get_workouts(db=db, user_id=current_user.id)


@router.get("/{workout_id}", response_model=Workout)
def get_workout(
    workout_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific workout."""
    try:
        return workout_service.get_workout(
            db=db,
            workout_id=UUID(workout_id),
            user_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/", response_model=Workout)
def create_workout(
    workout: WorkoutCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new workout."""
    return workout_service.create_workout(
        db=db,
        workout=workout,
        user_id=current_user.id
    )


@router.put("/{workout_id}", response_model=Workout)
def update_workout(
    workout_id: str,
    workout: WorkoutUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a workout."""
    try:
        return workout_service.update_workout(
            db=db,
            workout_id=UUID(workout_id),
            workout=workout,
            user_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{workout_id}")
def delete_workout(
    workout_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a workout."""
    success = workout_service.delete_workout(
        db=db,
        workout_id=UUID(workout_id),
        user_id=current_user.id
    )
    if not success:
        raise HTTPException(status_code=404, detail="Workout not found")
    return {"message": "Workout deleted successfully"}


# Section endpoints
@router.post("/{workout_id}/sections", response_model=WorkoutSection)
def create_section(
    workout_id: str,
    section: WorkoutSectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new section in a workout."""
    try:
        return workout_service.create_section(
            db=db,
            workout_id=UUID(workout_id),
            section=section,
            user_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/sections/{section_id}", response_model=WorkoutSection)
def update_section(
    section_id: str,
    section: WorkoutSectionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a workout section."""
    try:
        return workout_service.update_section(
            db=db,
            section_id=UUID(section_id),
            section=section,
            user_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/sections/{section_id}")
def delete_section(
    section_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a workout section."""
    success = workout_service.delete_section(
        db=db,
        section_id=UUID(section_id),
        user_id=current_user.id
    )
    if not success:
        raise HTTPException(status_code=404, detail="Section not found")
    return {"message": "Section deleted successfully"}


# Exercise endpoints
@router.post("/sections/{section_id}/exercises", response_model=Exercise)
def create_exercise(
    section_id: str,
    exercise: ExerciseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new exercise in a section."""
    try:
        return workout_service.create_exercise(
            db=db,
            section_id=UUID(section_id),
            exercise=exercise,
            user_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/exercises/{exercise_id}", response_model=Exercise)
def update_exercise(
    exercise_id: str,
    exercise: ExerciseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an exercise."""
    try:
        return workout_service.update_exercise(
            db=db,
            exercise_id=UUID(exercise_id),
            exercise=exercise,
            user_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/exercises/{exercise_id}")
def delete_exercise(
    exercise_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an exercise."""
    success = workout_service.delete_exercise(
        db=db,
        exercise_id=UUID(exercise_id),
        user_id=current_user.id
    )
    if not success:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return {"message": "Exercise deleted successfully"}
