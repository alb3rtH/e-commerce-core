import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CreateUserDto } from './dtos/user.dto';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { GetUser } from '../../common/decorators/get-user/get-user.decorator';
import { ResponseUserDto } from './dtos/user.response.dto';
import { UserRole } from './domain/user.entity';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

/**
 * Controller responsible for handling user-related HTTP requests.
 * Provides endpoints for user creation, retrieval, and role management.
 * All endpoints are prefixed with `/users`.
 *
 * @example
 * ```typescript
 * // Creating a new user
 * POST /users
 * {
 *   "email": "user@example.com",
 *   "password": "securePassword123"
 * }
 * ```
 *
 * @public
 */
@ApiTags('Users')
@Controller('users')
export class UsersController {
  /**
   * Creates an instance of UsersController.
   *
   * @param userService - The service handling user business logic and data persistence
   */
  constructor(private readonly userService: UserService) {}

  /**
   * Creates a new user account.
   *
   * @remarks
   * This endpoint is publicly accessible and does not require authentication.
   * The created user will be assigned default permissions based on the provided DTO.
   *
   * @param createUserDto - Data transfer object containing user registration information
   * @returns A promise resolving to the newly created user data (excluding sensitive fields)
   * @throws {ConflictException} When a user with the provided email already exists
   * @throws {BadRequestException} When the provided data fails validation constraints
   *
   * @example
   * ```typescript
   * // Successful response
   * {
   *   "id": "550e8400-e29b-41d4-a716-446655440000",
   *   "email": "user@example.com",
   *   "role": "customer",
   *   "createdAt": "2024-01-15T10:30:00Z"
   * }
   * ```
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates a new user account with the provided credentials. ' +
      'Returns the created user profile without sensitive information.',
  })
  @ApiBody({
    type: CreateUserDto,
    description: 'User registration data',
    required: true,
  })
  @ApiCreatedResponse({
    description: 'User successfully created',
    type: ResponseUserDto,
  })
  @ApiConflictResponse({
    description: 'User with this email already exists',
    schema: {
      example: {
        statusCode: 40,
        message: 'Email is already exist',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data - validation failed',
    schema: {
      example: {
        statusCode: 400,
        message: ['email must be a valid email address'],
        error: 'Bad Request',
      },
    },
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<ResponseUserDto> {
    return await this.userService.saveOneUser(createUserDto);
  }

  /**
   * Retrieves a list of all registered users.
   *
   * @remarks
   * This is a protected endpoint requiring valid JWT authentication.
   * Access is restricted to users with ADMIN role only.
   * Consider implementing pagination for production environments with large user bases.
   *
   * @param userRole - The role of the authenticated user, extracted from JWT payload
   * @returns A promise resolving to an array of user entities
   * @throws {UnauthorizedException} When the requesting user lacks ADMIN privileges
   * @throws {UnauthorizedException} When the JWT token is invalid or expired
   *
   * @security JWT
   * @see {@link JwtAuthGuard}
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Retrieve all users',
    description:
      'Returns a complete list of registered users. ' +
      '**Admin access only**: Requires valid JWT with ADMIN role. ' +
      'Consider implementing pagination for large datasets.',
  })
  @ApiOkResponse({
    description: 'List of users retrieved successfully',
    type: ResponseUserDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    description: 'Insufficient permissions - Admin role required',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  async findAll(@GetUser('role') userRole: string) {
    if ((UserRole.ADMIN as string) !== userRole) {
      throw new UnauthorizedException('no role admin');
    }

    return await this.userService.findAllUsers();
  }

  /**
   * Retrieves the profile information of the currently authenticated user.
   *
   * @remarks
   * This endpoint returns the complete profile of the user making the request.
   * Useful for "My Account" pages and profile management features.
   *
   * @param userId - The unique identifier of the authenticated user, extracted from JWT payload
   * @returns A promise resolving to the user's profile data
   * @throws {NotFoundException} When no user exists with the provided ID
   * @throws {UnauthorizedException} When the JWT token is invalid or missing
   *
   * @security JWT
   * @see {@link JwtAuthGuard}
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      'Retrieves the profile information of the currently authenticated user.',
  })
  //TODO: Crear un dto que sea resposable de responder tanto al get all users como al get user de /users/me con los datos del users/me
  @ApiOkResponse({
    description: 'Current user profile retrieved successfully',
    type: ResponseUserDto, // Esto también registra el schema
  })
  @ApiNotFoundResponse({
    description: 'User profile not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found',
      },
    },
  })
  async findById(@GetUser('id') userId: string) {
    return await this.userService.findOneUser(userId);
  }

  /**
   * Assigns administrator privileges to a user.
   *
   * @remarks
   * ⚠️ This endpoint appears to be incomplete (returns a static string).
   * Implementation should include:
   * - Target user identification (via body or query parameter)
   * - Authorization check (only existing admins should assign admin roles)
   * - Validation to prevent privilege escalation attacks
   * - Audit logging for security compliance
   *
   * @returns A static message indicating the intended operation
   *
   * @todo Implement actual role assignment logic
   * @todo Add proper authentication and authorization guards
   * @todo Add request body validation for target user identification
   *
   * @deprecated This method is not fully implemented and should not be used in production.
   */
  @Patch('assign/admin')
  @ApiOperation({
    summary: 'Assign admin role (NOT IMPLEMENTED)',
    description: 'Not fully implemented.',
    deprecated: true,
  })
  @ApiOkResponse({
    description: 'Static response',
    type: String,
  })
  assignAdminRole() {
    return 'Assigned role "role"';
  }
}
