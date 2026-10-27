import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
} from "class-validator"

export class AudienceDto {
  @IsString()
  @IsIn(["all", "emails"])
  audienceType!: "all" | "emails"

  @IsArray()
  @ArrayMaxSize(1000)
  @IsEmail({}, { each: true })
  @IsOptional()
  emails?: string[]
}
