#!/bin/bash -e
export AWS_PROFILE
unset BUCKETSED
[[ $AWS_PROFILE == prod ]] && BUCKETSED=prod
[[ $DEPLOY_ENV == prod ]] && BUCKETSED=prod
rm -rf .terraform/terraform.tfstate
terraform init -backend-config="bucket=sneller$BUCKETSED-deployment" -backend-config="key=terraform/sneller-web.tfstate" -migrate-state
terraform $*
