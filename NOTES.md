```
 gh api search/code \
    --method GET \
    -f q='org:sibipro "@sibipro/checkout-link" in:file filename:package.json -repo:sibipro/checkout-link' \
    --jq '.items[].repository.full_name' | sort | uniq
```
