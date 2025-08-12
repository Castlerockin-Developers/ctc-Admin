# File Upload Debug Guide

## Issue: 
Getting "JSON parse error - 'utf-8' codec can't decode byte 0x89 in position 391: invalid start byte"

## Root Cause:
This error happens when sending FormData (with file uploads) but the backend tries to parse it as JSON.

## Solutions Applied:

### 1. ✅ Fixed Frontend Headers
```javascript
// OLD (WRONG) - This sets JSON content type automatically
const response = await authFetch('/learning/custom-modules/', {
    method: 'POST',
    body: moduleData  // FormData
});

// NEW (CORRECT) - Manual fetch without JSON headers
const response = await fetch('http://localhost:8000/api/learning/custom-modules/', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer ' + accessToken,
        // NO Content-Type - browser sets it automatically for FormData
    },
    body: moduleData
});
```

### 2. ✅ Added Media Files URL
```python
# In crackthecampus/urls.py
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

### 3. ✅ Backend Properly Configured
- Serializer handles FormData automatically
- CORS configured for file uploads
- Media files settings configured

## Testing Steps:

1. **Open Browser DevTools** → Network tab
2. **Try creating a module** with an image
3. **Check the request headers** in Network tab:
   - Should NOT have `Content-Type: application/json`
   - Should have `Content-Type: multipart/form-data; boundary=...`
4. **Check the request payload** - should show FormData with:
   - name: "Module Name"
   - desc: "Description"
   - image: (binary file data)

## If Still Getting Errors:

### Check Console Logs:
The code now logs detailed error information:
```javascript
console.error('Response status:', response.status);
console.error('Response text:', errorText);
```

### Common Issues & Solutions:

1. **Token Issues** → Check Authorization header format
2. **File Size** → Try with smaller image (< 1MB)
3. **File Type** → Ensure image file (jpg, png, etc.)
4. **Network** → Check if backend is running on http://localhost:8000

### Backend Debug (if needed):
Add this to your Django view temporarily:
```python
def post(self, request):
    print("Content-Type:", request.content_type)
    print("Files:", request.FILES)
    print("Data:", request.data)
    # ... rest of the code
```

## Expected Behavior:
1. Upload starts → Shows "Creating..." button
2. Success → Shows success popup + redirects to Step 2
3. Error → Shows error popup with details in console