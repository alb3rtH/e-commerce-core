import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from 'src/common/roles/roles.guard';
import { Roles } from 'src/common/roles/roles.decorator';
import { UserRole } from '../user/domain/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async save(@Body() createProductdto: CreateProductDto) {
    return await this.productService.saveProduct(createProductdto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async getAll() {
    return this.productService.getAllProduct();
  }
}
