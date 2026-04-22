import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create.dto';
import { UpdateProductDto } from './dto/update.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from 'src/common/roles/roles.guard';
import { Roles } from 'src/common/roles/roles.decorator';
import { UserRole } from '../user/domain/user.entity';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Product } from './domain/product.entity';

/**
 * Controller responsible for handling product-related HTTP requests.
 *
 * @remarks
 * All endpoints in this controller are protected by JWT authentication and role-based authorization.
 * Only users with ADMIN role can access these endpoints.
 *
 * @example
 * ```typescript
 * // Example usage through HTTP client
 * GET /product          // Retrieve all products
 * GET /product/:id      // Retrieve specific product
 * POST /product         // Create new product
 * PUT /product/:id      // Update existing product
 * DELETE /product/:id   // Remove product
 * ```
 */
@ApiTags('Products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('product')
export class ProductController {
  /**
   * Creates an instance of ProductController.
   *
   * @param productService - The service handling product business logic and data operations
   */
  constructor(private readonly productService: ProductService) {}

  /**
   * Creates a new product in the system.
   *
   * @param createProductdto - Data transfer object containing product creation details
   * @returns A promise resolving to the newly created product entity
   * @throws {BadRequestException} When the provided data fails validation
   * @throws {UnauthorizedException} When the request lacks valid authentication
   * @throws {ForbiddenException} When the authenticated user lacks ADMIN privileges
   *
   * @remarks
   * Requires ADMIN role. The product data is validated against CreateProductDto schema before processing.
   *
   * @example
   * ```typescript
   * // Request body example
   * {
   *   "name": "Premium Widget",
   *   "description": "High-quality widget for professional use",
   *   "price": 9999,
   *   "stock": 150
   * }
   * ```
   */
  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create a new Product',
    description:
      'Creates a new product with the provided credentials. ' +
      'Returns a created product',
  })
  @ApiBody({
    type: CreateProductDto,
    description: 'Product data',
    required: true,
  })
  @ApiCreatedResponse({
    description: 'Product Created Successfull',
    type: CreateProductDto,
  })
  @ApiBearerAuth('access-token')
  async save(@Body() createProductdto: CreateProductDto): Promise<Product> {
    return await this.productService.createProduct(createProductdto);
  }

  /**
   * Retrieves all products stored in the system.
   *
   * @returns A promise resolving to an array of all product entities
   * @throws {UnauthorizedException} When the request lacks valid authentication
   * @throws {NotFoundException} When there are no products in the database
   * @throws {BadGatewayException} When exist a error in query petition
   * @throws {InternalServerErrorException} When failed to fetch product
   * @remarks
   * Requires ADMIN or CUSTOMER role. Returns an empty array if no products exist.
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a list of all Products',
    description: 'Get a list of all product with the provided credentials.',
  })
  @ApiBearerAuth('access-token')
  async getAll(): Promise<Product[]> {
    return this.productService.findAllProduct();
  }

  /**
   * Retrieves a specific product by its unique identifier.
   *
   * @param id - The unique identifier of the product to retrieve
   * @returns A promise resolving to the requested product entity
   * @throws {NotFoundException} When no product exists with the provided ID
   * @throws {UnauthorizedException} When the request lacks valid authentication
   * @throws {ForbiddenException} When the authenticated user lacks ADMIN privileges
   * @throws {BadRequestException} When the provided ID format is invalid
   *
   * @remarks
   * Requires ADMIN role. The ID parameter is validated as a string identifier.
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a Product with ID',
    description: 'Get a product with the provided credentials.',
  })
  @ApiBearerAuth('access-token')
  @ApiParam({
    name: 'id',
    required: true,
    description: 'id of resource',
    type: String,
  })
  @ApiOkResponse({
    description: 'product found',
    type: Product,
  })
  async getOne(@Param('id') id: string) {
    return this.productService.findOneProduct(id);
  }

  /**
   * Updates an existing product's information.
   *
   * @param id - The unique identifier of the product to update
   * @param updateProductDto - Data transfer object containing the fields to update
   * @returns A promise resolving to the updated product entity
   * @throws {NotFoundException} When no product exists with the provided ID
   * @throws {BadRequestException} When the update data fails validation
   * @throws {UnauthorizedException} When the request lacks valid authentication
   * @throws {ForbiddenException} When the authenticated user lacks ADMIN privileges
   *
   * @remarks
   * Requires ADMIN role. Partial updates are supported - only provided fields will be modified.
   *
   * @example
   * ```typescript
   * // Request body example (partial update)
   * {
   *   "price": 7999,
   *   "stock": 200
   * }
   * ```
   */
  @Put(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a Product with ID',
    description: 'Update a Product with the provided credentials.',
  })
  @ApiBearerAuth('access-token')
  @ApiParam({
    name: 'id',
    required: true,
    description: 'id of resource',
    type: String,
  })
  @ApiBody({
    type: UpdateProductDto,
  })
  @ApiOkResponse({
    description: 'updated product',
    type: Product,
  })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.updateProduct(id, updateProductDto);
  }

  /**
   * Permanently removes a product from the system.
   *
   * @param id - The unique identifier of the product to delete
   * @returns A promise resolving to the deletion confirmation or removed product entity
   * @throws {NotFoundException} When no product exists with the provided ID
   * @throws {UnauthorizedException} When the request lacks valid authentication
   * @throws {ForbiddenException} When the authenticated user lacks ADMIN privileges
   * @throws {ConflictException} When the product cannot be deleted due to existing dependencies
   *
   * @remarks
   * Requires ADMIN role. This operation is irreversible. Consider soft-delete patterns
   * if historical data retention is required.
   *
   * @warning
   * Deleting a product may affect related orders, inventory records, or analytics data.
   * Ensure proper cascade rules are configured in the service layer.
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a Product with ID',
    description: 'Delete a Product with the provided credentials.',
  })
  @ApiBearerAuth('access-token')
  @ApiParam({
    name: 'id',
    required: true,
    description: 'id of resource',
    type: String,
  })
  @ApiOkResponse({
    description: 'deleted product',
    type: Product,
  })
  @ApiUnauthorizedResponse({
    example: { message: 'Unauthorized', statusCode: 401 },
  })
  //TODO: mejorar la respuesto a un UpdateProductDto
  async delete(@Param('id') id: string) {
    return this.productService.deleteProduct(id);
  }
}
