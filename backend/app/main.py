from fastapi import FastAPI, HTTPException, Query, Depends
from sqlalchemy.orm import Session, relationship
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from database import get_db, engine, Base
from pydantic import BaseModel
from typing import List
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import cast, Date

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
) # this allows react to talk to the backend

# In-memory storage for exercises
exercises = ["Squat", "Deadlift", "Bench Press", "Pull-up", "Push-up"]
exercise_presets = {} 
workouts = []

#Base = declarative_base()

# Define the structure of a workout entry
class WorkoutEntry(BaseModel):
    exercise: str
    sets: int
    reps: int
    weight: float
    date: datetime
    #id: int

class WorkoutWithID(WorkoutEntry):
    id: int

class Workout(Base):
    __tablename__ = "workouts"
    id = Column(Integer, primary_key = True, index = True)
    exercise = Column(String, index=True)
    sets = Column(Integer)
    reps = Column(Integer)
    weight = Column(Float)
    date = Column(DateTime)

# Track the next workout ID
next_workout_id = 1
workouts = []

class Exercise(BaseModel):
    exercise: str

@app.post("/workout") # create a new workout
def log_workout(entry: WorkoutEntry, db: Session = Depends(get_db)):
    global next_workout_id
    entry.exercise = entry.exercise.strip().title()

    # Add exercise to list if it's new
    if entry.exercise not in exercises:
        exercises.append(entry.exercise)
     # Create new entry with an ID
    workout_with_id = WorkoutWithID(id=next_workout_id, **entry.dict())
    workouts.append(workout_with_id)
    next_workout_id += 1


    # Save the latest sets, reps, and weight for this exercise
    exercise_presets[entry.exercise] = {
        "sets": entry.sets,
        "reps": entry.reps,
        "weight": entry.weight
    }

    workout = Workout(**entry.dict())  # Create DB model instance
    db.add(workout)
    db.commit()
    db.refresh(workout)
    return {"message": "Workout saved!", "entry": entry}

@app.post("/exercises")
def add_exercise(exercise: Exercise):
    exercises.append(exercise.exercise)
    return {"message": f"Exercise '{exercise.exercise}' added successfully!"}


@app.get("/workouts", response_model=List[WorkoutWithID])
def get_workouts():
    return workouts

@app.get("/preset/{exercise}")
def get_preset(exercise: str):
    preset = exercise_presets.get(exercise)
    if preset:
        return preset
    else:
        return {"sets": 1, "reps": 1, "weight": 0.1}  # Default if not found

@app.get("/exercises", response_model=List[str])
def get_exercises():
    return exercises

@app.get("/")
def read_root():
    return {"message": "Welcome to the Workout Tracker API 💪"}

@app.delete("/workout/{workout_id}")
def delete_workout(workout_id: int):
    for i, entry in enumerate(workouts):
        if entry.id == workout_id:
            del workouts[i]
            return {"message": f"Workout with ID {workout_id} deleted"}
    raise HTTPException(status_code=404, detail="Workout not found")


@app.delete("/workouts/by_date/{date}")
def delete_workouts_by_date(date: str):
    try:
        target_date = datetime.fromisoformat(date).date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    global workouts
    original_len = len(workouts)
    workouts = [w for w in workouts if w.date.date() != target_date]
    deleted_count = original_len - len(workouts)

    return {"message": f"Deleted {deleted_count} workouts on {date}"}