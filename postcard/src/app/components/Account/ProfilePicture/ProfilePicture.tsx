import { User } from '@/backend/users';
import { faPen } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ChangeEvent, useRef, useState } from 'react';

export default function ProfilePicture(props: {
  user?: User;
  onEdit?: (formData: { profilePicture: File }) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, onEdit } = props;
  const isEditable = !!onEdit;

  const [isProfileHovered, setIsProfileHovered] = useState(false);
  const [fileUrl, setFileUrl] = useState<string>(
    user?.profilePicturePath ?? '/static/default_profile.jpg'
  );

  const handleProfilePictureClick = () => {
    if (isEditable) {
      fileInputRef.current?.click();
    }
  };

  const handleProfilePictureChange = (event: ChangeEvent<HTMLInputElement>) => {
    const profilePicture = event.target.files?.[0];
    if (profilePicture && onEdit) {
      setFileUrl(URL.createObjectURL(profilePicture));
      onEdit({ profilePicture });
    }
  };

  return (
    <div className="grid h-fit" onClick={handleProfilePictureClick}>
      <input
        type="file"
        name="profile_picture"
        ref={fileInputRef}
        onChange={handleProfilePictureChange}
        hidden
      />
      <img
        src={fileUrl}
        alt="profile"
        className={`rounded-full object-cover min-w-64 w-64 min-h-64 h-64 col-start-1 row-start-1 bg-black ${
          isEditable ? 'hover:opacity-50 transition-opacity' : ''
        }`}
        onMouseEnter={() => setIsProfileHovered(true)}
        onMouseLeave={() => setIsProfileHovered(false)}
      />
      {isEditable && isProfileHovered && (
        <FontAwesomeIcon
          icon={faPen}
          className="h-24 w-full col-start-1 row-start-1 self-center transition-all"
        />
      )}
    </div>
  );
}
