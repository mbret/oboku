import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { CommunicationPostgresEntity } from "./entities"

@Injectable()
export class CommunicationPostgresService {
  constructor(
    @InjectRepository(CommunicationPostgresEntity)
    public readonly repository: Repository<CommunicationPostgresEntity>,
  ) {}
}
