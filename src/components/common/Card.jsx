import React from 'react';
import PropTypes from 'prop-types';

const Card = ({ 
  children, 
  className = '', 
  variant = 'default',
  size = 'md',
  interactive = false,
  loading = false,
  ...props 
}) => {
  const baseClasses = 'glass-card transition-all duration-300';
  
  const variants = {
    default: '',
    elevated: 'shadow-glass-lg hover:shadow-glass-xl',
    flat: 'shadow-soft border border-gray-200',
    gradient: 'bg-gradient-to-br from-white/80 to-white/60',
    dark: 'bg-gray-800/80 text-white border-gray-700/50'
  };
  
  const sizes = {
    sm: 'p-4 rounded-xl',
    md: 'p-6 rounded-2xl',
    lg: 'p-8 rounded-3xl',
    xl: 'p-10 rounded-3xl'
  };
  
  const interactiveClasses = interactive 
    ? 'cursor-pointer hover:scale-[1.02] hover:shadow-glass-lg' 
    : '';
  
  const classes = `
    ${baseClasses}
    ${variants[variant]}
    ${sizes[size]}
    ${interactiveClasses}
    ${className}
  `.trim();

  if (loading) {
    return (
      <div className={classes} {...props}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'elevated', 'flat', 'gradient', 'dark']),
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  interactive: PropTypes.bool,
  loading: PropTypes.bool
};

// Composant Card Header
export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`mb-6 ${className}`} {...props}>
    {children}
  </div>
);

// Composant Card Body
export const CardBody = ({ children, className = '', ...props }) => (
  <div className={`${className}`} {...props}>
    {children}
  </div>
);

// Composant Card Footer
export const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`mt-6 pt-4 border-t border-gray-200/50 ${className}`} {...props}>
    {children}
  </div>
);

// Composant Card avec titre et description
export const CardWithHeader = ({ 
  title, 
  description, 
  icon: Icon, 
  children, 
  actions,
  className = '',
  ...props 
}) => (
  <Card className={className} {...props}>
    <CardHeader>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 rounded-xl bg-gradient-primary text-white">
              <Icon size={20} />
            </div>
          )}
          <div>
            <h3 className="text-lg font-bold text-gray-800">{title}</h3>
            {description && (
              <p className="text-gray-600 text-sm font-medium">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </CardHeader>
    <CardBody>
      {children}
    </CardBody>
  </Card>
);

// Composant Stat Card
export const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  changeType = 'positive',
  color = 'blue',
  className = '',
  ...props 
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600',
    red: 'from-red-500 to-red-600',
    cyan: 'from-cyan-500 to-cyan-600'
  };

  const changeClasses = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  };

  return (
    <Card variant="elevated" className={`stat-card ${className}`} {...props}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl bg-gradient-to-r ${colorClasses[color]} shadow-lg`}>
          <Icon className="text-white" size={24} />
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold gradient-text">{value}</div>
          {change && (
            <div className={`text-sm font-semibold mt-1 ${changeClasses[changeType]}`}>
              {change}
            </div>
          )}
        </div>
      </div>
      <div>
        <p className="text-gray-700 font-semibold">{title}</p>
      </div>
    </Card>
  );
};

// Composant Metric Card avec progress
export const MetricCard = ({ 
  title, 
  value, 
  target, 
  icon: Icon, 
  color = 'blue',
  className = '',
  ...props 
}) => {
  const percentage = target ? Math.round((value / target) * 100) : 0;
  
  const colorClasses = {
    blue: {
      gradient: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-100',
      text: 'text-blue-600'
    },
    green: {
      gradient: 'from-green-500 to-green-600',
      bg: 'bg-green-100',
      text: 'text-green-600'
    },
    orange: {
      gradient: 'from-orange-500 to-orange-600',
      bg: 'bg-orange-100',
      text: 'text-orange-600'
    },
    purple: {
      gradient: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-100',
      text: 'text-purple-600'
    }
  };

  const colors = colorClasses[color];

  return (
    <Card className={className} {...props}>
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-2xl ${colors.bg}`}>
          <Icon className={colors.text} size={20} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold gradient-text">{value}</span>
            {target && (
              <span className="text-gray-500 text-sm">/ {target}</span>
            )}
          </div>
        </div>
      </div>
      
      {target && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Progression</span>
            <span className="text-sm font-bold text-gray-800">{percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full bg-gradient-to-r ${colors.gradient} transition-all duration-1000`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            ></div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default Card;