import { Controller, NotImplementedException, ParseUUIDPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { ChangeOrdersStatusDto, CreateOrderDto, UpdateOrderDto } from './dto';
import { OrdersPaginationDto } from './dto';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @MessagePattern('createOrder')
  create(@Payload() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @MessagePattern('findAllOrders')
  findAll(@Payload() ordersPaginationDto: OrdersPaginationDto) {
    return this.ordersService.findAll(ordersPaginationDto);
  }

  @MessagePattern('findAllOrdersByStatus')
  findAllOrdersByStatus(@Payload() OrdersPaginationDto: OrdersPaginationDto) {
    return this.ordersService.findAll(OrdersPaginationDto);
  }

  @MessagePattern('findOneOrder')
  findOne(@Payload('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @MessagePattern('changeStatusOrders')
  changeOrdersStatus(@Payload() changeOrdersStatusDto: ChangeOrdersStatusDto) {
    return this.ordersService.changeOrdersStatus(changeOrdersStatusDto)
  }

  @MessagePattern('updateOrder')
  update(@Payload() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(updateOrderDto.id, updateOrderDto);
  }

  @MessagePattern('removeOrder')
  remove(@Payload() id: number) {
    return this.ordersService.remove(id);
  }

  @MessagePattern('changeOrderStatus')
  changeOrderStatus() {
    // return this.ordersService.changeOrdersStatus()
    throw new NotImplementedException()
  }
}
