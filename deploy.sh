#!/bin/bash

aws s3 cp --recursive --acl public-read ./docs/ s3://defi-org/
