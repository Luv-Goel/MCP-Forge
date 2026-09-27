#!/usr/bin/env python3
"""
Validation Worker - Phase 2.
Runs as a background job that validates manifests and probes servers.
"""
import asyncio, json, time, uuid, os, sys
from dataclasses import dataclass, asdict, field
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path

class JobStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

@dataclass
class ValidationJob:
    job_id: str
    manifest_path: str
    created_at: str
    status: str = "pending"
    started_at: str = ""
    completed_at: str = ""
    result: dict = field(default_factory=dict)
    error: str = ""

def load_manifest_validator():
    """Lazy-load the manifest spec validator."""
    sys.path.insert(0, str(Path(__file__).parent.parent.parent / "packages" / "manifest-spec" / "src"))
    from parser import load_manifest
    return load_manifest

def load_probe():
    """Lazy-load the runtime probe."""
    sys.path.insert(0, str(Path(__file__).parent.parent.parent / "packages" / "runtime" / "src"))
    from probe import run_probe
    return run_probe

def load_score():
    """Lazy-load the trust scorer."""
    sys.path.insert(0, str(Path(__file__).parent.parent.parent / "packages" / "scoring" / "src"))
    from score import score_package
    return score_package

async def validate_job(job: ValidationJob) -> ValidationJob:
    """Execute a validation job."""
    job.status = JobStatus.RUNNING.value
    job.started_at = datetime.now(timezone.utc).isoformat()
    
    try:
        manifest_validator = load_manifest_validator()
        run_probe = load_probe()
        score_package = load_score()
        
        # Step 1: Load and validate manifest
        try:
            manifest_data = manifest_validator(job.manifest_path)
        except FileNotFoundError:
            raise RuntimeError(f"Manifest not found: {job.manifest_path}")
        except Exception as e:
            raise RuntimeError(f"Manifest validation failed: {e}")
        
        # Step 2: Probe runtime
        probe_result = run_probe(job.manifest_path)
        
        # Step 3: Compute trust score
        trust_result = score_package(job.manifest_path, probe_result)
        
        # Step 4: Compatibility matrix
        sys.path.insert(0, str(Path(__file__).parent.parent.parent / "packages" / "client-templates" / "src"))
        from compat import analyze_package
        compat_result = analyze_package(job.manifest_path)
        
        job.result = {
            "manifest": {
                "name": manifest_data.get("name"),
                "slug": manifest_data.get("slug"),
                "primitives": manifest_data.get("primitives"),
                "transports": manifest_data.get("transports"),
                "scopes": [s["name"] for s in manifest_data.get("scopes", [])],
            },
            "probe": probe_result,
            "trust_score": trust_result,
            "compatibility": compat_result,
            "validated_at": datetime.now(timezone.utc).isoformat(),
        }
        job.status = JobStatus.COMPLETED.value
        
    except Exception as e:
        job.status = JobStatus.FAILED.value
        job.error = str(e)
    
    job.completed_at = datetime.now(timezone.utc).isoformat()
    return job

async def run_worker(queue_file: str = "jobs/queue.jsonl", poll_interval: float = 5.0):
    """Run the validation worker loop."""
    os.makedirs(os.path.dirname(queue_file), exist_ok=True)
    
    print(f"[Worker] Starting validation worker, polling {queue_file}")
    
    while True:
        # Read pending jobs
        pending = []
        if os.path.exists(queue_file):
            with open(queue_file) as f:
                for line in f:
                    line = line.strip()
                    if line:
                        try:
                            pending.append(json.loads(line))
                        except:
                            pass
        
        if not pending:
            await asyncio.sleep(poll_interval)
            continue
        
        # Process first pending job
        job_data = pending[0]
        job = ValidationJob(**job_data)
        
        print(f"[Worker] Processing job {job.job_id}: {job.manifest_path}")
        job = await validate_job(job)
        
        # Write result
        result_file = f"jobs/results/{job.job_id}.json"
        os.makedirs(os.path.dirname(result_file), exist_ok=True)
        with open(result_file, "w") as f:
            json.dump(job.__dict__, f, indent=2, default=str)
        
        # Remove from queue
        with open(queue_file, "w") as f:
            for j in pending[1:]:
                f.write(json.dumps(j) + "\n")
        
        print(f"[Worker] Job {job.job_id} -> {job.status} ({job.completed_at})")
        await asyncio.sleep(1)

def enqueue_job(manifest_path: str, queue_file: str = "jobs/queue.jsonl") -> str:
    """Add a validation job to the queue."""
    os.makedirs(os.path.dirname(queue_file), exist_ok=True)
    job = ValidationJob(
        job_id=str(uuid.uuid4()),
        manifest_path=manifest_path,
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    with open(queue_file, "a") as f:
        f.write(json.dumps(job.__dict__, default=str) + "\n")
    return job.job_id

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="MCP Forge Validation Worker")
    parser.add_argument("--queue", default="jobs/queue.jsonl")
    parser.add_argument("--enqueue", help="Manifest path to enqueue (don't run worker)")
    args = parser.parse_args()
    
    if args.enqueue:
        job_id = enqueue_job(args.enqueue, args.queue)
        print(f"Enqueued job: {job_id}")
    else:
        asyncio.run(run_worker(args.queue))