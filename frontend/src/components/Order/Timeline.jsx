import { motion } from 'framer-motion';

export const Timeline = ({ status, deliveryDate }) => {
  const stages = [
    { name: 'Processing', color: 'bg-blue-500' },
    { name: 'Shipped', color: 'bg-purple-500' },
    { name: 'Delivered', color: 'bg-green-500' }
  ];

  return (
    <div className="relative h-16 mx-4 my-8">
      <div className="absolute top-1/2 h-1 bg-gray-200 w-full -translate-y-1/2"></div>
      
      {stages.map((stage, index) => (
        <motion.div
          key={stage.name}
          className={`absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full ${stage.color} ${
            status === stage.name ? 'scale-125' : 'scale-100'
          }`}
          style={{
            left: `${(index / (stages.length - 1)) * 100}%`,
            marginLeft: '-16px'
          }}
          initial={{ scale: 0 }}
          animate={{ scale: status === stage.name ? 1.2 : 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-sm">
            {stage.name}
          </div>
        </motion.div>
      ))}
      
      <div className="text-center mt-12">
        Estimated Delivery: {new Date(deliveryDate).toLocaleDateString()}
      </div>
    </div>
  );
};