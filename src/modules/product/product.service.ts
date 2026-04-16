import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { QueryFailedError, Repository, UpdateResult } from 'typeorm';
import { Product } from './domain/product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateProductDto } from './dto/create.dto';
import { UpdateProductDto } from './dto/update.dto';

@Injectable()
export class ProductService {
  private logger: Logger;

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {
    this.logger = new Logger(ProductService.name);
  }

  async createProduct(createProductdto: CreateProductDto) {
    if (await this.findProductByName(createProductdto.name)) {
      throw new BadRequestException('Product is already exist');
    }
    const product = this.productRepository.create(createProductdto);

    try {
      return await this.productRepository.save(product);
    } catch (error: unknown) {
      if (error instanceof QueryFailedError) {
        const logger = new Logger(error.name);
        const driverError = error.driverError as { code?: string };
        if (driverError.code == '23505') {
          logger.error('sku diplicated');
          throw new BadRequestException('sku duplicated');
        }
        const message = `database error code: ${driverError.code}`;
        logger.error(message);
        throw new BadRequestException(message || 'Database Error');
      }
      const log = new Logger();
      log.error(error);
      throw new InternalServerErrorException('Failed to create product');
    }
  }

  async findAllProduct(): Promise<Product[]> {
    try {
      return this.productRepository.find();
    } catch (error: unknown) {
      if (error instanceof QueryFailedError) {
        const driverError = error.driverError as { code?: string };
        const message = `database error code: ${driverError.code}`;
        throw new BadRequestException(message || 'database error');
      }
      this.logger.error(error);
      throw new InternalServerErrorException('Failed to fetch products');
    }
  }

  async findOneProduct(productID: string): Promise<Product | null> {
    try {
      return await this.productRepository.findOne({ where: { id: productID } });
    } catch (error: unknown) {
      if (error instanceof QueryFailedError) {
        const driverError = error.driverError as { code?: string };
        const message = `database error code: ${driverError.code}`;
        throw new BadRequestException(message || 'database error');
      }

      this.logger.error(error);
      throw new InternalServerErrorException('Failed to retrieve product');
    }
  }

  async updateProduct(productID: string, updateProductDto: UpdateProductDto) {
    const product = await this.findOneProduct(productID);
    if (!product) {
      throw new BadRequestException('Product not found');
    }

    // Check if SKU is being updated and if it's unique
    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const existingProduct = await this.productRepository.findOneBy({
        sku: updateProductDto.sku,
      });
      if (existingProduct) {
        throw new BadRequestException('SKU already exists');
      }
    }

    // Merge the update data
    this.productRepository.merge(product, updateProductDto);

    try {
      return await this.productRepository.save(product);
    } catch (error: unknown) {
      if (error instanceof QueryFailedError) {
        const driverError = error.driverError as { code?: string };
        if (driverError.code == '23505') {
          this.logger.error('sku duplicated');
          throw new BadRequestException('sku duplicated');
        }
        const message = `database error code: ${driverError.code}`;
        this.logger.error(message);
        throw new BadRequestException(message || 'Database Error');
      }
      this.logger.error(error);
      throw new InternalServerErrorException('Failed to update product');
    }
  }

  //NOTE: Add logic to perform a soft delete
  async deleteProduct(productID: string) {
    const product = await this.productRepository.findOne({
      where: { id: productID },
    });

    if (!product) {
      throw new BadRequestException('User Not Found');
    }

    const result: UpdateResult = await this.productRepository.softDelete({
      id: productID,
    });
    if (result.affected === 0) {
      throw new BadRequestException(
        `result row affect number: ${result.affected}`,
      );
    }
    return product;
  }

  private async findProductByName(name: string): Promise<Product | null> {
    return this.productRepository.findOneBy({ name: name });
  }
}
