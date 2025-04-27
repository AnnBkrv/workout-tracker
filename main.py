from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
) # this allows react to talk to the backend

# This is your in-memory "database"
workouts = []

# Define the structure of a workout entry
class WorkoutEntry(BaseModel):
    exercise: str
    sets: int
    reps: int
    weight: float
    date: datetime

@app.post("/workout")
def log_workout(entry: WorkoutEntry):
    workouts.append(entry)
    return {"message": "Workout saved!", "entry": entry}

@app.get("/workouts", response_model=List[WorkoutEntry])
def get_workouts():
    return workouts

@app.get("/")
def read_root():
    return {"message": "Welcome to the Workout Tracker API 💪"}