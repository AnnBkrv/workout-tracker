from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy.orm import Session, relationship
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from database import get_db, engine, Base
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
)

# In-memory storage for exercises
exercises = ["Squat", "Deadlift", "Bench Press", "Pull-up", "Push-up"]
exercise_presets = {} 

# Define the structure of a workout entry. i.e. a set of exercises performed on a certain day
class ExerciseEntry(BaseModel):
    exercise: str
    sets: int
    reps: int
    weight: float
    #date: datetime, only the whole workout should have a date, not individ exercises
    #id: int

class WorkoutCreate(BaseModel):
    date: datetime
    exercises: List[ExerciseEntry]

class Workout(Base):
    __tablename__ = "workouts"
    id = Column(Integer, primary_key = True, index = True)
    date = Column(DateTime)
    exercises = relationship("ExerciseEntryDB", backref="workout")

class ExerciseEntryDB(Base):
    __tablename__ = "exercise_entries"

    id = Column(Integer, primary_key=True, index=True)
    workout_id = Column(Integer, ForeignKey("workouts.id"))

    exercise = Column(String)
    sets = Column(Integer)
    reps = Column(Integer)
    weight = Column(Float)

Base.metadata.create_all(bind=engine)

class Exercise(BaseModel):
    exercise: str

@app.post("/workout")
def log_workout(workout: WorkoutCreate, db: Session = Depends(get_db)):
    # 1. Create workout (session)
    db_workout = Workout(date=workout.date)
    db.add(db_workout)
    db.flush()

    # 2. Add exercises
    for ex in workout.exercises:
        db_ex = ExerciseEntryDB(
            workout_id=db_workout.id,
            exercise=ex.exercise.strip().title(),
            sets=ex.sets,
            reps=ex.reps,
            weight=ex.weight
        )
        db.add(db_ex)

    db.commit()

    return {"message": "Workout saved!"}

@app.post("/exercises")
def add_exercise(exercise: Exercise):
    exercises.append(exercise.exercise)
    return {"message": f"Exercise '{exercise.exercise}' added successfully!"}


@app.get("/workouts") # a list of all workouts
def get_workouts(db: Session = Depends(get_db)):
    workouts = db.query(Workout).all()

    result = []
    for w in workouts:
        result.append({
            "id": w.id,
            "date": w.date,
            "exercises": [
                {
                    "exercise": ex.exercise,
                    "sets": ex.sets,
                    "reps": ex.reps,
                    "weight": ex.weight
                }
                for ex in w.exercises
            ]
        })

    return result

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

@app.delete("/exercise/{exercise_id}") # delete an exercise in a workout
def delete_exercise(exercise_id: int, db: Session = Depends(get_db)):

    exercise = db.query(ExerciseEntryDB).filter(
        ExerciseEntryDB.id == exercise_id
    ).first()

    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    db.delete(exercise)
    db.commit()

    return {"message": f"Exercise {exercise_id} deleted"}


@app.delete("/workout/{workout_id}") # delete a workout
def delete_workout(workout_id: int, db: Session = Depends(get_db)):
    
    workout = db.query(Workout).filter(Workout.id == workout_id).first()

    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    # delete all related exercises first
    db.query(ExerciseEntryDB).filter(
        ExerciseEntryDB.workout_id == workout_id
    ).delete()

    # delete the workout itself
    db.delete(workout)
    db.commit()

    return {"message": f"Workout {workout_id} deleted"}