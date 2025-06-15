# ECS Unified Service Configuration - Single Container for Frontend + Backend
resource "aws_ecs_task_definition" "app" {
  family                   = "${var.project_name}-app"
  network_mode             = "awsvpc"
  requires_compatibility   = ["FARGATE"]
  cpu                      = "1024"
  memory                   = "2048"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn           = aws_iam_role.ecs_task.arn

  runtime_platform {
    cpu_architecture        = "ARM64"
    operating_system_family = "LINUX"
  }

  container_definitions = jsonencode([
    {
      name  = "app"
      image = "${aws_ecr_repository.app.repository_url}:latest"
      
      portMappings = [
        {
          containerPort = 80
          protocol      = "tcp"
        },
        {
          containerPort = 5000
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "DATABASE_URL"
          value = "postgresql://postgres:${var.db_password}@${aws_db_instance.main.endpoint}/cdp_platform"
        },
        {
          name  = "AWS_S3_BUCKET"
          value = aws_s3_bucket.assets.bucket
        },
        {
          name  = "AWS_REGION"
          value = var.aws_region
        }
      ]

      secrets = [
        {
          name      = "SNOWFLAKE_ACCOUNT"
          valueFrom = aws_secretsmanager_secret.snowflake.arn
        },
        {
          name      = "SNOWFLAKE_USER"
          valueFrom = "${aws_secretsmanager_secret.snowflake.arn}:username::"
        },
        {
          name      = "SNOWFLAKE_PASSWORD"
          valueFrom = "${aws_secretsmanager_secret.snowflake.arn}:password::"
        },
        {
          name      = "SNOWFLAKE_DATABASE"
          valueFrom = "${aws_secretsmanager_secret.snowflake.arn}:database::"
        },
        {
          name      = "SNOWFLAKE_WAREHOUSE"
          valueFrom = "${aws_secretsmanager_secret.snowflake.arn}:warehouse::"
        },
        {
          name      = "SESSION_SECRET"
          valueFrom = aws_secretsmanager_secret.session.arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.app.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost/ && curl -f http://localhost:5000/api/health || exit 1"]
        interval    = 30
        timeout     = 10
        retries     = 3
        startPeriod = 60
      }

      essential = true
    }
  ])

  tags = {
    Name        = "${var.project_name}-app-task"
    Environment = var.environment
  }
}

resource "aws_ecs_service" "app" {
  name            = "${var.project_name}-app"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = aws_subnet.private[*].id
    security_groups = [aws_security_group.ecs.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "app"
    container_port   = 80
  }

  depends_on = [aws_lb_listener.main]

  tags = {
    Name        = "${var.project_name}-app-service"
    Environment = var.environment
  }
}

resource "aws_appautoscaling_target" "app" {
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.app.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "app_up" {
  name               = "${var.project_name}-app-scale-up"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.app.resource_id
  scalable_dimension = aws_appautoscaling_target.app.scalable_dimension
  service_namespace  = aws_appautoscaling_target.app.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
  }
}

resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/${var.project_name}/app"
  retention_in_days = 14

  tags = {
    Name        = "${var.project_name}-app-logs"
    Environment = var.environment
  }
}

# Secrets Manager for sensitive configuration
resource "aws_secretsmanager_secret" "snowflake" {
  name        = "${var.project_name}/snowflake"
  description = "Snowflake connection credentials"

  tags = {
    Name        = "${var.project_name}-snowflake-secrets"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "snowflake" {
  secret_id = aws_secretsmanager_secret.snowflake.id
  secret_string = jsonencode({
    account   = "q84sale"
    username  = "CDP_USER"
    password  = var.snowflake_password
    database  = "DBT_CORE_PROD_DATABASE"
    warehouse = "LOOKER"
  })
}

resource "aws_secretsmanager_secret" "session" {
  name        = "${var.project_name}/session"
  description = "Session secret for Express"

  tags = {
    Name        = "${var.project_name}-session-secret"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "session" {
  secret_id = aws_secretsmanager_secret.session.id
  secret_string = var.session_secret
}

# IAM policy for accessing secrets
resource "aws_iam_role_policy" "ecs_secrets" {
  name = "${var.project_name}-ecs-secrets-policy"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.snowflake.arn,
          aws_secretsmanager_secret.session.arn
        ]
      }
    ]
  })
}