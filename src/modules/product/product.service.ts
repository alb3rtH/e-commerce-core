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
import { UpdateProductDto } from './dto/update.dto';

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
        const message = `database error code: ${driverError.code}`;
        throw new BadRequestException(message || 'Database Error');
      }
      const log = new Logger();
      log.error(error);
      throw new InternalServerErrorException('Failed to create product');
    }
  }

  async getAllProduct(): Promise<Product[] | undefined> {
    try {
      return this.productRepository.find();
    } catch (error: unknown) {
      if (error instanceof QueryFailedError) {
        const driverError = error.driverError as { code?: string };
        const message = `database error code: ${driverError.code}`;
        throw new BadRequestException(message || 'database error');
      }
    }
  }

  async getAProduct(productID: string): Promise<Product | undefined | null> {
    try {
      return await this.productRepository.findOne({ where: { id: productID } });
    } catch (error: unknown) {
      if (error instanceof QueryFailedError) {
        const driverError = error.driverError as { code?: string };
        const message = `database error code: ${driverError.code}`;
        throw new BadRequestException(message || 'database error');
      }
    }
  }

  async updateProduct(productID: string, updateProductDto: UpdateProductDto) {
    const product = await this.getAProduct(productID);
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
      await this.productRepository.save(product);
      return 'Product updated successfully';
    } catch (error: unknown) {
      if (error instanceof QueryFailedError) {
        const driverError = error.driverError as { code?: string };
        if (driverError.code == '23505') {
          throw new BadRequestException('SKU duplicated');
        }
        const message = `database error code: ${driverError.code}`;
        throw new BadRequestException(message || 'Database Error');
      }
      const log = new Logger();
      log.error(error);
      throw new InternalServerErrorException('Failed to update product');
    }
  }

  async deleteProduct(productID: string) {
    const product = await this.getAProduct(productID);
    if (!product) {
      throw new BadRequestException('Product not found');
    }

    try {
      await this.productRepository.remove(product);
      return 'Product deleted successfully';
    } catch (error: unknown) {
      if (error instanceof QueryFailedError) {
        const driverError = error.driverError as { code?: string };
        const message = `database error code: ${driverError.code}`;
        throw new BadRequestException(message || 'Database Error');
      }
      const log = new Logger();
      log.error(error);
      throw new InternalServerErrorException('Failed to delete product');
    }
  }

  private async findProductByName(name: string): Promise<Product | null> {
    return this.productRepository.findOneBy({ name: name });
  }
}
