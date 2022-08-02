terraform {
  # Store the state in the s3://sneller-deployment/terraform folder. We will
  # use a different state file for each region in which Sneller will be
  # deployed.
  backend "s3" {
    region = "us-east-1"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.15"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

data "aws_caller_identity" "current" {
}

data "aws_route53_zone" "sneller_io" {
  name = local.current_env.domain
}

resource "aws_acm_certificate" "sneller" {
  domain_name               = "web.${local.current_env.domain}"
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "sneller_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.sneller.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.sneller_io.zone_id
}

resource "aws_acm_certificate_validation" "sneller" {
  certificate_arn         = aws_acm_certificate.sneller.arn
  validation_record_fqdns = [for record in aws_route53_record.sneller_cert_validation : record.fqdn]
}

resource "aws_s3_bucket" "sneller-web" {
  bucket = "sneller-web${local.current_env.prod}"
}

data "aws_iam_policy_document" "sneller-web" {
  statement {
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.sneller-web.arn}/*"]
  }
}

resource "aws_s3_bucket_policy" "sneller-web" {
  bucket = aws_s3_bucket.sneller-web.bucket
  policy = data.aws_iam_policy_document.sneller-web.json
}

resource "aws_s3_bucket_website_configuration" "sneller-web" {
  bucket = aws_s3_bucket.sneller-web.bucket

  index_document {
    suffix = "index.html"
  }
}

resource "aws_cloudfront_distribution" "sneller-web" {
  enabled         = true
  is_ipv6_enabled = true
  comment         = "Sneller web test console"

  origin {
    origin_id   = "s3bucket"
    domain_name = aws_s3_bucket.sneller-web.website_endpoint

    connection_attempts = 3
    connection_timeout  = 10

    custom_origin_config {
      http_port                = 80
      https_port               = 443
      origin_keepalive_timeout = 5
      origin_protocol_policy   = "http-only"
      origin_read_timeout      = 30
      origin_ssl_protocols     = ["TLSv1", "TLSv1.1", "TLSv1.2"]
    }
  }

  default_cache_behavior {
    target_origin_id       = "s3bucket"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = true
      cookies {
        forward = "none"
      }
    }
  }

  aliases = ["web.${local.current_env.domain}"]

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    minimum_protocol_version = "TLSv1.2_2021"
    acm_certificate_arn      = aws_acm_certificate.sneller.arn
    ssl_support_method       = "sni-only"
  }
}

resource "aws_route53_record" "web" {
  zone_id = data.aws_route53_zone.sneller_io.zone_id
  name    = "web.${local.current_env.domain}"
  type    = "A"

  alias {
    zone_id                = aws_cloudfront_distribution.sneller-web.hosted_zone_id
    name                   = aws_cloudfront_distribution.sneller-web.domain_name
    evaluate_target_health = false
  }
}
