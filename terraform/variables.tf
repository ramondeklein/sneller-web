locals {
  environments = {
    "671229366946" = {
      domain = "sneller-dev.io",
      prod   = "",
    },
    "701831592002" = {
      domain = "sneller.io",
      prod   = "prod",
    }
  }
  current_env = local.environments[data.aws_caller_identity.current.account_id]
}
