import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Card, { StatCard, MetricCard, CardWithHeader } from '../Card';
import { Car, DollarSign } from 'lucide-react';

// Mock pour les icônes Lucide React
jest.mock('lucide-react', () => ({
  Car: ({ size, className, ...props }) => (
    <div data-testid="car-icon" data-size={size} className={className} {...props}>
      Car Icon
    </div>
  ),
  DollarSign: ({ size, className, ...props }) => (
    <div data-testid="dollar-icon" data-size={size} className={className} {...props}>
      Dollar Icon
    </div>
  ),
}));

describe('Card Component', () => {
  test('renders basic card with children', () => {
    render(
      <Card>
        <p>Test content</p>
      </Card>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  test('applies custom className', () => {
    render(
      <Card className="custom-class">
        <p>Test content</p>
      </Card>
    );
    
    const card = screen.getByText('Test content').closest('div');
    expect(card).toHaveClass('custom-class');
  });

  test('renders with different variants', () => {
    const { rerender } = render(
      <Card variant="elevated">
        <p>Elevated card</p>
      </Card>
    );
    
    let card = screen.getByText('Elevated card').closest('div');
    expect(card).toHaveClass('shadow-glass-lg');
    
    rerender(
      <Card variant="flat">
        <p>Flat card</p>
      </Card>
    );
    
    card = screen.getByText('Flat card').closest('div');
    expect(card).toHaveClass('shadow-soft');
  });

  test('renders with different sizes', () => {
    const { rerender } = render(
      <Card size="sm">
        <p>Small card</p>
      </Card>
    );
    
    let card = screen.getByText('Small card').closest('div');
    expect(card).toHaveClass('p-4');
    
    rerender(
      <Card size="lg">
        <p>Large card</p>
      </Card>
    );
    
    card = screen.getByText('Large card').closest('div');
    expect(card).toHaveClass('p-8');
  });

  test('handles interactive prop', () => {
    render(
      <Card interactive>
        <p>Interactive card</p>
      </Card>
    );
    
    const card = screen.getByText('Interactive card').closest('div');
    expect(card).toHaveClass('cursor-pointer');
    expect(card).toHaveClass('hover:scale-[1.02]');
  });

  test('shows loading state', () => {
    render(
      <Card loading>
        <p>This should not be visible</p>
      </Card>
    );
    
    expect(screen.queryByText('This should not be visible')).not.toBeInTheDocument();
    expect(screen.getByRole('generic')).toHaveClass('animate-pulse');
  });

  test('handles click events when interactive', () => {
    const handleClick = jest.fn();
    
    render(
      <Card interactive onClick={handleClick}>
        <p>Clickable card</p>
      </Card>
    );
    
    const card = screen.getByText('Clickable card').closest('div');
    fireEvent.click(card);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

describe('StatCard Component', () => {
  const defaultProps = {
    title: 'Test Metric',
    value: '42',
    icon: Car,
    change: '+10%',
    changeType: 'positive',
    color: 'blue'
  };

  test('renders stat card with all props', () => {
    render(<StatCard {...defaultProps} />);
    
    expect(screen.getByText('Test Metric')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('+10%')).toBeInTheDocument();
    expect(screen.getByTestId('car-icon')).toBeInTheDocument();
  });

  test('applies correct color classes', () => {
    render(<StatCard {...defaultProps} color="green" />);
    
    const iconContainer = screen.getByTestId('car-icon').closest('div');
    expect(iconContainer).toHaveClass('from-green-500', 'to-green-600');
  });

  test('handles different change types', () => {
    const { rerender } = render(
      <StatCard {...defaultProps} changeType="positive" />
    );
    
    let changeElement = screen.getByText('+10%');
    expect(changeElement).toHaveClass('text-green-600');
    
    rerender(<StatCard {...defaultProps} changeType="negative" />);
    
    changeElement = screen.getByText('+10%');
    expect(changeElement).toHaveClass('text-red-600');
    
    rerender(<StatCard {...defaultProps} changeType="neutral" />);
    
    changeElement = screen.getByText('+10%');
    expect(changeElement).toHaveClass('text-gray-600');
  });

  test('renders without change prop', () => {
    const propsWithoutChange = { ...defaultProps };
    delete propsWithoutChange.change;
    
    render(<StatCard {...propsWithoutChange} />);
    
    expect(screen.getByText('Test Metric')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.queryByText('+10%')).not.toBeInTheDocument();
  });
});

describe('MetricCard Component', () => {
  const defaultProps = {
    title: 'Progress Metric',
    value: 75,
    target: 100,
    icon: DollarSign,
    color: 'blue'
  };

  test('renders metric card with progress bar', () => {
    render(<MetricCard {...defaultProps} />);
    
    expect(screen.getByText('Progress Metric')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('/ 100')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByTestId('dollar-icon')).toBeInTheDocument();
  });

  test('calculates percentage correctly', () => {
    render(<MetricCard {...defaultProps} value={30} target={120} />);
    
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  test('renders without target', () => {
    const propsWithoutTarget = { ...defaultProps };
    delete propsWithoutTarget.target;
    
    render(<MetricCard {...propsWithoutTarget} />);
    
    expect(screen.getByText('Progress Metric')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.queryByText('/ 100')).not.toBeInTheDocument();
    expect(screen.queryByText('75%')).not.toBeInTheDocument();
  });

  test('handles zero target gracefully', () => {
    render(<MetricCard {...defaultProps} target={0} />);
    
    expect(screen.queryByText('Progression')).not.toBeInTheDocument();
  });

  test('caps progress bar at 100%', () => {
    render(<MetricCard {...defaultProps} value={150} target={100} />);
    
    expect(screen.getByText('150%')).toBeInTheDocument();
    
    const progressBar = screen.getByRole('progressbar') || 
                       document.querySelector('[style*="width"]');
    
    if (progressBar) {
      expect(progressBar.style.width).toBe('100%');
    }
  });
});

describe('CardWithHeader Component', () => {
  const defaultProps = {
    title: 'Card Title',
    description: 'Card description',
    icon: Car,
    children: <p>Card content</p>
  };

  test('renders card with header', () => {
    render(<CardWithHeader {...defaultProps} />);
    
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card description')).toBeInTheDocument();
    expect(screen.getByText('Card content')).toBeInTheDocument();
    expect(screen.getByTestId('car-icon')).toBeInTheDocument();
  });

  test('renders without description', () => {
    const propsWithoutDescription = { ...defaultProps };
    delete propsWithoutDescription.description;
    
    render(<CardWithHeader {...propsWithoutDescription} />);
    
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.queryByText('Card description')).not.toBeInTheDocument();
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  test('renders without icon', () => {
    const propsWithoutIcon = { ...defaultProps };
    delete propsWithoutIcon.icon;
    
    render(<CardWithHeader {...propsWithoutIcon} />);
    
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.queryByTestId('car-icon')).not.toBeInTheDocument();
  });

  test('renders with actions', () => {
    const actions = (
      <button data-testid="action-button">Action</button>
    );
    
    render(<CardWithHeader {...defaultProps} actions={actions} />);
    
    expect(screen.getByTestId('action-button')).toBeInTheDocument();
  });

  test('forwards additional props to Card', () => {
    render(
      <CardWithHeader 
        {...defaultProps} 
        className="custom-header-card"
        variant="elevated"
      />
    );
    
    const card = screen.getByText('Card Title').closest('.glass-card');
    expect(card).toHaveClass('custom-header-card');
  });
});

// Tests d'intégration
describe('Card Integration Tests', () => {
  test('card components work together', () => {
    render(
      <div>
        <StatCard
          title="Revenue"
          value="€1,234"
          icon={DollarSign}
          change="+15%"
          changeType="positive"
          color="green"
        />
        <MetricCard
          title="Completion"
          value={85}
          target={100}
          icon={Car}
          color="blue"
        />
      </div>
    );
    
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('€1,234')).toBeInTheDocument();
    expect(screen.getByText('Completion')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  test('handles responsive behavior', () => {
    // Simuler un écran mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(
      <Card size="md" className="responsive-card">
        <p>Responsive content</p>
      </Card>
    );
    
    const card = screen.getByText('Responsive content').closest('div');
    expect(card).toHaveClass('responsive-card');
  });
});

// Tests de performance
describe('Card Performance Tests', () => {
  test('handles many cards efficiently', () => {
    const startTime = performance.now();
    
    const cards = Array.from({ length: 100 }, (_, i) => (
      <Card key={i}>
        <p>Card {i}</p>
      </Card>
    ));
    
    render(<div>{cards}</div>);
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Le rendu de 100 cartes ne devrait pas prendre plus de 100ms
    expect(renderTime).toBeLessThan(100);
    
    expect(screen.getByText('Card 0')).toBeInTheDocument();
    expect(screen.getByText('Card 99')).toBeInTheDocument();
  });
});

// Tests d'accessibilité
describe('Card Accessibility Tests', () => {
  test('interactive cards have proper ARIA attributes', () => {
    render(
      <Card interactive role="button" aria-label="Clickable card">
        <p>Accessible content</p>
      </Card>
    );
    
    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('aria-label', 'Clickable card');
    expect(card).toHaveClass('cursor-pointer');
  });

  test('stat cards have proper semantic structure', () => {
    render(
      <StatCard
        title="Accessible Metric"
        value="100"
        icon={Car}
        change="+5%"
        changeType="positive"
        color="blue"
      />
    );
    
    const title = screen.getByText('Accessible Metric');
    const value = screen.getByText('100');
    
    expect(title).toBeInTheDocument();
    expect(value).toBeInTheDocument();
    
    // Vérifier que les éléments importants sont visibles
    expect(title).toBeVisible();
    expect(value).toBeVisible();
  });
});