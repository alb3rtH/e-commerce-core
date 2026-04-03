import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { QueryFailedError, Repository } from 'typeorm';
import { Product } from './domain/product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateProductDto } from './dto/create.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async saveProduct(createProductdto: CreateProductDto) {
    if (await this.findProductByName(createProductdto.name)) {
      throw new BadRequestException('Product is already exist');
    }
    const product = this.productRepository.create(createProductdto);

    try {
      await this.productRepository.save(product);
      return 'product created successfully';
    } catch (error: unknown) {
      if (error instanceof QueryFailedError) {
        const driverError = error.driverError as { code?: string };
        if (driverError.code == '23505') {
          throw new BadRequestException('sku duplicated');
        }
        throw new BadRequestException(driverError.code || 'Database Error');
      }
      const log = new Logger();
      log.error(error);
      throw new InternalServerErrorException('Failed to create product');
    }
  }

  private async findProductByName(name: string): Promise<Product | null> {
    return this.productRepository.findOneBy({ name: name });
  }
}
