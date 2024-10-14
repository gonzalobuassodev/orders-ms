import { OrderStatus } from "@prisma/client";
import { IsEnum } from "class-validator";
import { PaginationDto } from "src/common";

export class OrdersPaginationDto extends PaginationDto {

    @IsEnum(OrderStatus, {
        message: `Possible status values are ${OrderStatus}`
    })
    status: OrderStatus

}