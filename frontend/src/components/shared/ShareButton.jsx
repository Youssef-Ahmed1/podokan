import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiShare2, FiCopy, FiX } from 'react-icons/fi';
import { FaFacebookF, FaTwitter, FaWhatsapp, FaTelegramPlane } from 'react-icons/fa';
import { toast } from 'react-toastify';

const ShareButton = ({ url, title }) => {
  const [isOpen, setIsOpen] = useState(false);
  const formattedUrl = `${window.location.origin}/product/${url}`;
  const message = encodeURIComponent(`Check this podokan design! ${title}\n${formattedUrl}`);

  const shareLinks = [
    {
      name: 'Facebook',
      icon: FaFacebookF,
      url: `https://www.facebook.com/sharer/sharer.php?u=${formattedUrl}`,
      color: '#1877f2'
    },
    {
      name: 'Twitter',
      icon: FaTwitter,
      url: `https://twitter.com/intent/tweet?text=${message}`,
      color: '#1da1f2'
    },
    {
      name: 'WhatsApp',
      icon: FaWhatsapp,
      url: `https://wa.me/?text=${message}`,
      color: '#25d366'
    },
    {
      name: 'Telegram',
      icon: FaTelegramPlane,
      url: `https://t.me/share/url?url=${formattedUrl}&text=${encodeURIComponent(title)}`,
      color: '#0088cc'
    }
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formattedUrl);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <FiShare2 className="w-5 h-5" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute right-0 mt-2 p-3 bg-white rounded-xl shadow-lg z-50 min-w-[200px]"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium">Share this design</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-3">
              {shareLinks.map((platform) => (
                <motion.a
                  key={platform.name}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${platform.color}20` }}
                >
                  <platform.icon 
                    className="w-5 h-5"
                    style={{ color: platform.color }}
                  />
                </motion.a>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={copyToClipboard}
              className="w-full p-2 flex items-center justify-center gap-2 bg-gray-100 
                hover:bg-gray-200 rounded-lg transition-colors text-sm"
            >
              <FiCopy className="w-4 h-4" />
              Copy Link
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShareButton;