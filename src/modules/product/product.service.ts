import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Repository, UpdateResult } from 'typeorm';
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

    return await this.productRepository.save(product);
  }

  async findAllProduct(): Promise<Product[]> {
    const products = await this.productRepository.find({
      select: {
        id: true,
        name: true,
        price: true,
        sku: true,
        description: true,
        stock: true,
      },
    });

    if (products.length <= 0) {
      throw new NotFoundException('There are no registered products');
    } else {
      return products;
    }
  }

  async findOneProduct(productID: string): Promise<Product | null> {
    return await this.productRepository.findOne({
      where: { id: productID },
      select: {
        id: true,
        name: true,
        price: true,
        sku: true,
        description: true,
        stock: true,
      },
    });
  }

  async updateProduct(productID: string, updateProductDto: UpdateProductDto) {
    const product = await this.findOneProduct(productID);
    if (!product) {
      throw new BadRequestException('Product not found');
    }

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
    return await this.productRepository.save(product);
  }

  //NOTE: Add logic to perform a soft delete
  async deleteProduct(productID: string) {
    const product = await this.productRepository.findOne({
      where: { id: productID },
    });

    if (!product) {
      throw new BadRequestException('Product Not Found');
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
