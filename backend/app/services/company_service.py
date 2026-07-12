from __future__ import annotations

import logging
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.exceptions import NotFoundException
from app.repositories import CompanyRepository
from app.schemas import CompanyCreate, CompanyUpdate

logger = logging.getLogger(__name__)


class CompanyService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.repo = CompanyRepository(db)

    async def list_companies(
        self,
        page: int = 1,
        per_page: int = 20,
        keyword: str | None = None,
    ) -> tuple[list[dict], int]:
        logger.info("Listing companies (page=%d, keyword=%s)", page, keyword)
        docs, total = await self.repo.get_all(page, per_page, keyword)
        
        hydrated_docs = []
        for doc in docs:
            stats = await self.repo.get_company_stats(doc["id"])
            hydrated_doc = {**doc, **stats}
            hydrated_docs.append(hydrated_doc)
            
        return hydrated_docs, total

    async def get_company(self, company_id: str) -> dict:
        company = await self.repo.get_by_id(company_id)
        if not company:
            raise NotFoundException("Company not found")
            
        stats = await self.repo.get_company_stats(company_id)
        return {**company, **stats}

    async def create_company(self, user_id: str, data: CompanyCreate) -> dict:
        company_doc = {
            "company_code": data.company_code,
            "company_name": data.company_name,
            "district": data.district,
            "province": data.province,
        }
        company_id = await self.repo.create(company_doc)
        company = await self.repo.get_by_id(company_id)
        if not company:
            raise NotFoundException("Company not found after creation")
            
        stats = {"total_farms": 0, "total_zones": 0, "total_trees": 0}
        logger.info("Company created: %s by user %s", company_id, user_id)
        return {**company, **stats}

    async def update_company(self, company_id: str, data: CompanyUpdate) -> dict:
        update_data = {}
        if data.company_code is not None:
            update_data["company_code"] = data.company_code
        if data.company_name is not None:
            update_data["company_name"] = data.company_name
        if data.district is not None:
            update_data["district"] = data.district
        if data.province is not None:
            update_data["province"] = data.province

        company = await self.repo.update(company_id, update_data)
        if not company:
            raise NotFoundException("Company not found")
            
        stats = await self.repo.get_company_stats(company_id)
        logger.info("Company updated: %s", company_id)
        return {**company, **stats}

    async def delete_company(self, company_id: str) -> None:
        deleted = await self.repo.delete(company_id)
        if not deleted:
            raise NotFoundException("Company not found")
        logger.info("Company deleted: %s", company_id)
