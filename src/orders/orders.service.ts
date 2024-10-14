import { HttpCode, HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaClient } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';
import { ChangeOrdersStatusDto, OrdersPaginationDto } from './dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger('OrdersService');

  async onModuleInit() {
    await this.$connect()

    this.logger.log('Connected to database');
  }

  create(createOrderDto: CreateOrderDto) {
    return this.order.create({
      data: createOrderDto,
    });
  }

  async findAll(ordersPaginationDto: OrdersPaginationDto) {

    const { page, limit, status } = ordersPaginationDto

    const totalPages = await this.order.count({
      where: { status }
    })
    const lastpage = Math.ceil(totalPages / limit)

    return {
      data: await this.order.findMany({
        where: { status },
        skip: (page - 1) * limit,
        take: limit
      }),
      meta: {
        total: totalPages,
        page,
        lastpage,
      }
    };
  }

  async findOne(id: string) {

    const order = await this.order.findFirst({ where: { id } })

    if (!order) throw new RpcException({
      status: HttpStatus.NOT_FOUND,
      message: `Order with id ${id} not found`,
    })

    return order;
  }

  update(id: number, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }

  async changeOrdersStatus(changeOrdersStatusDto: ChangeOrdersStatusDto) {

    const { id, status } = changeOrdersStatusDto

    const order = await this.findOne(id)

    if (order.status === status) {
      return order
    }

    return this.order.update({
      where: { id },
      data: { status }
    })
  }
}
