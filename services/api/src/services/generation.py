from __future__ import annotations

from ..models import Job


def generate_docs_text(job: Job) -> tuple[str, str]:
    title = job.title
    company = job.company
    location = job.location or "Remote"
    jd_snippet = (job.description or "").strip().splitlines()[0:3]
    jd_preview = "\n".join(jd_snippet)

    cv = (
        f"Tailored CV for {title} at {company}\n"
        f"Location: {location}\n\n"
        "Summary:\n"
        f"- Strong fit for {title} based on relevant skills and experience.\n\n"
        "Highlights:\n"
        f"- Impactful projects aligned with {company}'s domain.\n"
        "- Demonstrated ownership, collaboration, and learning velocity.\n"
    )

    cl = (
        f"Cover Letter — {title} at {company}\n\n"
        f"Dear {company} Hiring Team,\n\n"
        f"I am excited to apply for the {title} role.\n"
        "My background matches the key requirements and I am confident I can contribute immediately.\n\n"
        "Why me:\n"
        "- Relevant experience and motivation to excel.\n\n"
        "Regards,\nA Candidate\n\n"
        f"JD preview:\n{jd_preview}\n"
    )

    return cv, cl

