import { OrderStatus } from "@prisma/client";
import { UpdateOrderDto } from "./update-order.dto";
import { OrderStatusList } from "../enum/order.enum";
import { IsEnum, IsString, IsUUID } from "class-validator";

export class ChangeOrdersStatusDto {

    @IsUUID()
    id: string;

    @IsEnum(OrderStatusList, {
        message: `Possible status values are ${OrderStatusList}`
    })

    status: OrderStatus
}