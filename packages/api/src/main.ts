import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { config } from './config';
import * as winston from 'winston';

async function bootstrap() {
  const logger = winston.createLogger({
    level: config.logLevel,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }),
    ],
  });

  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // CORS configuration
  app.enableCors({
    origin: config.corsOrigins,
    credentials: true,
  });

  // OpenAPI/Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('AgentFactory API')
    .setDescription('REST API for AgentFactory - Multi-Agent System Platform')
    .setVersion('1.0.0')
    .addTag('compile', 'Project compilation endpoints')
    .addTag('deploy', 'Deployment management endpoints')
    .addTag('tools', 'Tool management endpoints')
    .addTag('blueprints', 'Blueprint management endpoints')
    .addTag('evaluations', 'Evaluation and metrics endpoints')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  // Expose raw OpenAPI JSON at /docs-json
  app.getHttpAdapter().get('/docs-json', (req, res) => {
    res.json(document);
  });

  await app.listen(config.port);
  logger.info(`AgentFactory API started on port ${config.port}`);
  logger.info(`OpenAPI documentation available at http://localhost:${config.port}/docs`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});