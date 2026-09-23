from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid
import datetime

from app.database import get_db
from app.models import Agent
from app.schemas import AgentCreate, AgentResponse

router = APIRouter(prefix="/agents", tags=["Agents"])

@router.get("", response_model=List[AgentResponse])
def list_agents(db: Session = Depends(get_db)):
    return db.query(Agent).order_by(Agent.created_at.desc()).all()

@router.post("", response_model=AgentResponse, status_code=201)
def create_agent(agent_in: AgentCreate, db: Session = Depends(get_db)):
    agent_id = agent_in.id or f"agent-{uuid.uuid4().hex[:8]}"
    existing = db.query(Agent).filter(Agent.id == agent_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Agent with this ID already exists")

    new_agent = Agent(
        id=agent_id,
        name=agent_in.name,
        description=agent_in.description,
        endpoint=agent_in.endpoint,
        model=agent_in.model,
        max_steps=agent_in.max_steps,
        max_response_time=agent_in.max_response_time,
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_agent)
    db.commit()
    db.refresh(new_agent)
    return new_agent

@router.get("/{agent_id}", response_model=AgentResponse)
def get_agent(agent_id: str, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent

@router.delete("/{agent_id}")
def delete_agent(agent_id: str, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    db.delete(agent)
    db.commit()
    return {"status": "deleted", "id": agent_id}
