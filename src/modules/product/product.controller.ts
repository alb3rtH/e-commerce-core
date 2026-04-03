import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async save(@Body() createProductdto: CreateProductDto) {
    return await this.productService.saveProduct(createProductdto);
  }
}
