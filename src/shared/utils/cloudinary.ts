  // Add a helper function to extract Cloudinary public_id from a URL
  const extractCloudinaryPublicId = (url: string): string | null => {
    try {
      if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) {
        return null;
      }

      // Format: https://res.cloudinary.com/CLOUD_NAME/image/upload/v1234567890/folder/public_id.extension
      const urlParts = url.split('/');
      const fileNameWithExtension = urlParts[urlParts.length - 1];
      const publicIdWithoutExtension = fileNameWithExtension.split('.')[0];

      // If the URL has a folder structure, include it in the public_id
      const uploadIndex = urlParts.indexOf('upload');
      if (uploadIndex !== -1 && uploadIndex < urlParts.length - 2) {
        const folderPath = urlParts.slice(uploadIndex + 1, urlParts.length - 1).join('/');
        const fullPublicId = `${folderPath}/${publicIdWithoutExtension}`;
        return fullPublicId;
      }

      return publicIdWithoutExtension;
    } catch (error) {
      console.error('Error extracting public_id from URL:', error);
      return null;
    }
  };

  const deleteOldProfilePhoto = async (oldPhotoUrl: string) => {
    try {
      const publicId = extractCloudinaryPublicId(oldPhotoUrl);
      if (!publicId) {
        console.log('Could not extract public_id from old profile photo URL');
        return;
      }

      console.log('Deleting old profile photo with public_id:', publicId);

      // Call the backend API to delete the photo
      const response = await fetch('https://learnex-backend.vercel.app/api/cloudinary/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ public_id: publicId }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Successfully deleted old profile photo:', data);
      } else {
        console.error('Failed to delete old profile photo:', data.error);
      }
    } catch (error) {
      console.error('Error deleting old profile photo:', error);
    }
  };

export {extractCloudinaryPublicId, deleteOldProfilePhoto};