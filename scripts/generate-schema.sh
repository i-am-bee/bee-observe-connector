#!/bin/bash
# Copyright 2024 IBM Corp.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


# Check if the input parameter (URL) is provided
if [ -z "$1" ]; then
  echo "Error: URL parameter is required."
  echo "Usage: yarn generate:schema <API_URL>"
  exit 1
fi

# Assign the input parameter to a variable
API_URL=$1

# Run the openapi-typescript command with the provided URL
npx openapi-typescript "$API_URL" -o ./src/internals/api/schema.d.ts --alphabetize

# Optional: Print a success message
echo "Schema successfully generated from $API_URL"
