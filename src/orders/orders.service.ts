import { HttpCode, HttpStatus, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaClient } from '@prisma/client';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { ChangeOrdersStatusDto, OrdersPaginationDto } from './dto';
import { firstValueFrom } from 'rxjs';
import { NATS_SERVICE } from 'src/config';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger('OrdersService');

  constructor(
    @Inject(NATS_SERVICE) private readonly productsClient: ClientProxy
  ) { super() }

  async onModuleInit() {
    await this.$connect()

    this.logger.log('Connected to database');
  }

  async create(createOrderDto: CreateOrderDto) {

    try {

      // 1 - Confirmar los ids de los productos
      const productIds = createOrderDto.items.map(item => item.productId)
      const products = await firstValueFrom(this.productsClient.send({ cmd: 'validate_product' }, productIds))

      const totalAmount = createOrderDto.items.reduce((acc, orderItem) => {
        const price = products.find(
          (product) => product.id === orderItem.productId,
        ).price;
        return acc + price * orderItem.quantity;
      }, 0);

      const totalItems = createOrderDto.items.reduce((acc, orderItem) => {
        return acc + orderItem.quantity
      }, 0);

      // 3 - Crear una transaccion de base de datos
      const order = await this.order.create({
        data: {
          totalAmount: totalAmount,
          totalItems: totalItems,
          OrderItem: {
            createMany: {
              data: createOrderDto.items.map((orderItem) => ({
                price: products.find(
                  (product) => product.id === orderItem.productId).price,
                productId: orderItem.productId,
                quantity: orderItem.quantity
              }))
            }
          }
        },
        include: {
          OrderItem: {
            select: {
              price: true,
              quantity: true,
              productId: true
            }
          }
        }
      })

      return {
        ...order,
        OrderItem: order.OrderItem.map((orderItem) => ({
          ...orderItem,
          name: products.find((product) => product.id === orderItem.productId).name
        }))
      }

    } catch (error) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Check logs'
      })
    }
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

    const order = await this.order.findFirst({
      where: { id },
      include: {
        OrderItem: {
          select: {
            price: true,
            quantity: true,
            productId: true
          }
        }
      }
    })

    if (!order) throw new RpcException({
      status: HttpStatus.NOT_FOUND,
      message: `Order with id ${id} not found`,
    })

    const productIds = order.OrderItem.map(orderItem => orderItem.productId)

    const products = await firstValueFrom(this.productsClient.send({ cmd: 'validate_product' }, productIds))


    return {
      ...order,
      OrderItem: order.OrderItem.map(orderItem => ({
        ...orderItem,
        name: products.find(product => product.id === orderItem.productId).name
      }))
    }
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
