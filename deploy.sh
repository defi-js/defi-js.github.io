#!/bin/bash

aws s3 cp --recursive --acl public-read ./public/ s3://defi-org/