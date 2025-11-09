/**
 * Advanced AI Prediction Engine
 * Phase 4: Enhanced ML capabilities with real-time learning
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  CheckCircle,
  Activity,
  Target,
  Zap,
  Settings
} from 'lucide-react';
import Plot from 'react-plotly.js';

interface PredictionModel {
  id: string;
  name: string;
  type: 'neural_network' | 'random_forest' | 'gradient_boost' | 'ensemble';
  accuracy: number;
  confidence: number;
  trainingData: number;
  lastUpdated: Date;
  status: 'training' | 'active' | 'deprecated';
  features: string[];
}

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  visibility: number;
  condition: string;
  impact: 'low' | 'medium' | 'high';
}

interface TrafficData {
  congestionLevel: number;
  averageSpeed: number;
  incidents: number;
  roadClosures: number;
  constructionZones: number;
  impact: 'low' | 'medium' | 'high';
}

interface PredictionResult {
  tripId: string;
  routeId: string;
  delayMinutes: number;
  confidence: number;
  factors: {
    weather: number;
    traffic: number;
    historical: number;
    events: number;
    time: number;
  };
  reasoning: string;
  alternatives: Array<{
    scenario: string;
    probability: number;
    delayMinutes: number;
  }>;
}

interface MLMetrics {
  modelPerformance: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    rmse: number;
  };
  realTimeStats: {
    predictionsToday: number;
    accurateToday: number;
    avgConfidence: number;
    processingTime: number;
  };
  featureImportance: Array<{
    feature: string;
    importance: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  }>;
}

export default function AIPredictionEngine() {
  const [models, setModels] = useState<PredictionModel[]>([]);
  const [activeModel, setActiveModel] = useState<string>('ensemble_v2');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [trafficData, setTrafficData] = useState<TrafficData | null>(null);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [mlMetrics, setMLMetrics] = useState<MLMetrics | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'models' | 'analytics' | 'settings'>('overview');

  // Initialize AI engine
  useEffect(() => {
    initializeAIEngine();
    fetchWeatherData();
    fetchTrafficData();
    fetchMLMetrics();
    
    // Set up real-time updates
    const interval = setInterval(() => {
      updateRealTimePredictions();
      fetchMLMetrics();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const initializeAIEngine = useCallback(async () => {
    try {
      const mockModels: PredictionModel[] = [
        {
          id: 'neural_network_v3',
          name: 'Deep Neural Network v3',
          type: 'neural_network',
          accuracy: 94.2,
          confidence: 0.89,
          trainingData: 125000,
          lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000),
          status: 'active',
          features: ['weather', 'traffic', 'historical', 'events', 'time', 'passenger_load']
        },
        {
          id: 'random_forest_v2',
          name: 'Random Forest v2',
          type: 'random_forest',
          accuracy: 91.7,
          confidence: 0.85,
          trainingData: 98000,
          lastUpdated: new Date(Date.now() - 4 * 60 * 60 * 1000),
          status: 'active',
          features: ['weather', 'traffic', 'historical', 'time']
        },
        {
          id: 'gradient_boost_v1',
          name: 'Gradient Boosting v1',
          type: 'gradient_boost',
          accuracy: 92.8,
          confidence: 0.87,
          trainingData: 110000,
          lastUpdated: new Date(Date.now() - 6 * 60 * 60 * 1000),
          status: 'active',
          features: ['weather', 'traffic', 'historical', 'events', 'time']
        },
        {
          id: 'ensemble_v2',
          name: 'Ensemble Model v2',
          type: 'ensemble',
          accuracy: 96.1,
          confidence: 0.92,
          trainingData: 150000,
          lastUpdated: new Date(Date.now() - 30 * 60 * 1000),
          status: 'active',
          features: ['weather', 'traffic', 'historical', 'events', 'time', 'passenger_load', 'driver_patterns']
        }
      ];

      setModels(mockModels);
    } catch (error) {
      console.error('Failed to initialize AI engine:', error);
    }
  }, []);

  const fetchWeatherData = useCallback(async () => {
    try {
      // Mock weather API integration
      const weatherData: WeatherData = {
        temperature: 72,
        humidity: 65,
        windSpeed: 8.5,
        precipitation: 0.2,
        visibility: 9.5,
        condition: 'partly_cloudy',
        impact: 'low'
      };
      setWeatherData(weatherData);
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
    }
  }, []);

  const fetchTrafficData = useCallback(async () => {
    try {
      // Mock traffic API integration
      const trafficData: TrafficData = {
        congestionLevel: 0.4,
        averageSpeed: 25.8,
        incidents: 2,
        roadClosures: 0,
        constructionZones: 1,
        impact: 'medium'
      };
      setTrafficData(trafficData);
    } catch (error) {
      console.error('Failed to fetch traffic data:', error);
    }
  }, []);

  const fetchMLMetrics = useCallback(async () => {
    try {
      const metrics: MLMetrics = {
        modelPerformance: {
          accuracy: 96.1,
          precision: 94.8,
          recall: 95.2,
          f1Score: 95.0,
          rmse: 2.34
        },
        realTimeStats: {
          predictionsToday: 2847,
          accurateToday: 2734,
          avgConfidence: 0.89,
          processingTime: 45
        },
        featureImportance: [
          { feature: 'Historical Patterns', importance: 0.28, trend: 'stable' },
          { feature: 'Real-time Traffic', importance: 0.24, trend: 'increasing' },
          { feature: 'Weather Conditions', importance: 0.18, trend: 'stable' },
          { feature: 'Time of Day', importance: 0.15, trend: 'decreasing' },
          { feature: 'Special Events', importance: 0.10, trend: 'increasing' },
          { feature: 'Passenger Load', importance: 0.05, trend: 'increasing' }
        ]
      };
      setMLMetrics(metrics);
    } catch (error) {
      console.error('Failed to fetch ML metrics:', error);
    }
  }, []);

  const updateRealTimePredictions = useCallback(async () => {
    try {
      // Mock real-time prediction updates
      const newPredictions: PredictionResult[] = [
        {
          tripId: 'trip_001',
          routeId: 'route_42',
          delayMinutes: 3.2,
          confidence: 0.91,
          factors: {
            weather: 0.1,
            traffic: 0.4,
            historical: 0.3,
            events: 0.0,
            time: 0.2
          },
          reasoning: 'Moderate traffic congestion on Main Street affecting schedule',
          alternatives: [
            { scenario: 'Best case', probability: 0.2, delayMinutes: 1.5 },
            { scenario: 'Most likely', probability: 0.6, delayMinutes: 3.2 },
            { scenario: 'Worst case', probability: 0.2, delayMinutes: 5.8 }
          ]
        }
      ];
      setPredictions(newPredictions);
    } catch (error) {
      console.error('Failed to update predictions:', error);
    }
  }, []);

  const handleModelRetrain = useCallback(async (modelId: string) => {
    setIsTraining(true);
    try {
      // Simulate model retraining
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setModels(prev => prev.map(model => 
        model.id === modelId 
          ? { 
              ...model, 
              accuracy: Math.min(100, model.accuracy + Math.random() * 2),
              lastUpdated: new Date(),
              trainingData: model.trainingData + Math.floor(Math.random() * 5000)
            }
          : model
      ));
    } catch (error) {
      console.error('Failed to retrain model:', error);
    } finally {
      setIsTraining(false);
    }
  }, []);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getModelTypeIcon = (type: PredictionModel['type']) => {
    switch (type) {
      case 'neural_network': return <Brain className="w-5 h-5" />;
      case 'random_forest': return <Activity className="w-5 h-5" />;
      case 'gradient_boost': return <TrendingUp className="w-5 h-5" />;
      case 'ensemble': return <Target className="w-5 h-5" />;
      default: return <Zap className="w-5 h-5" />;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Brain className="w-8 h-8 text-blue-600" />
                AI Prediction Engine
              </h1>
              <p className="text-gray-600 mt-2">
                Advanced machine learning system for real-time delay predictions
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleModelRetrain(activeModel)}
                disabled={isTraining}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isTraining ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Training...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Retrain Model
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: Activity },
                { id: 'models', label: 'Models', icon: Brain },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp },
                { id: 'settings', label: 'Settings', icon: Settings }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setSelectedTab(id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    selectedTab === id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {selectedTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Real-time Conditions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weather Conditions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Weather Impact</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      weatherData ? getImpactColor(weatherData.impact) : 'text-gray-600 bg-gray-100'
                    }`}>
                      {weatherData?.impact || 'Unknown'} Impact
                    </span>
                  </div>
                  {weatherData && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Temperature</div>
                        <div className="text-lg font-semibold">{weatherData.temperature}°F</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Humidity</div>
                        <div className="text-lg font-semibold">{weatherData.humidity}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Wind Speed</div>
                        <div className="text-lg font-semibold">{weatherData.windSpeed} mph</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Visibility</div>
                        <div className="text-lg font-semibold">{weatherData.visibility} mi</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Traffic Conditions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Traffic Impact</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      trafficData ? getImpactColor(trafficData.impact) : 'text-gray-600 bg-gray-100'
                    }`}>
                      {trafficData?.impact || 'Unknown'} Impact
                    </span>
                  </div>
                  {trafficData && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Congestion</div>
                        <div className="text-lg font-semibold">{Math.round(trafficData.congestionLevel * 100)}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Avg Speed</div>
                        <div className="text-lg font-semibold">{trafficData.averageSpeed} mph</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Incidents</div>
                        <div className="text-lg font-semibold">{trafficData.incidents}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Construction</div>
                        <div className="text-lg font-semibold">{trafficData.constructionZones}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Current Predictions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Real-time Predictions</h3>
                <div className="space-y-4">
                  {predictions.map((prediction) => (
                    <div key={prediction.tripId} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-blue-600" />
                          <div>
                            <div className="font-medium">Route {prediction.routeId}</div>
                            <div className="text-sm text-gray-600">Trip {prediction.tripId}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-orange-600">
                            +{prediction.delayMinutes.toFixed(1)} min
                          </div>
                          <div className="text-sm text-gray-600">
                            {Math.round(prediction.confidence * 100)}% confidence
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="text-sm text-gray-600 mb-2">Contributing Factors:</div>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(prediction.factors).map(([factor, weight]) => (
                            <span 
                              key={factor}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                            >
                              {factor}: {Math.round(weight * 100)}%
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                        <strong>Analysis:</strong> {prediction.reasoning}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Metrics */}
              {mlMetrics && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Model Performance</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Accuracy</span>
                        <span className="font-semibold">{mlMetrics.modelPerformance.accuracy.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Precision</span>
                        <span className="font-semibold">{mlMetrics.modelPerformance.precision.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Recall</span>
                        <span className="font-semibold">{mlMetrics.modelPerformance.recall.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">F1 Score</span>
                        <span className="font-semibold">{mlMetrics.modelPerformance.f1Score.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">RMSE</span>
                        <span className="font-semibold">{mlMetrics.modelPerformance.rmse.toFixed(2)} min</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Statistics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Predictions Made</span>
                        <span className="font-semibold">{mlMetrics.realTimeStats.predictionsToday.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Accurate Predictions</span>
                        <span className="font-semibold">{mlMetrics.realTimeStats.accurateToday.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg Confidence</span>
                        <span className="font-semibold">{Math.round(mlMetrics.realTimeStats.avgConfidence * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Processing Time</span>
                        <span className="font-semibold">{mlMetrics.realTimeStats.processingTime}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Success Rate</span>
                        <span className="font-semibold text-green-600">
                          {Math.round((mlMetrics.realTimeStats.accurateToday / mlMetrics.realTimeStats.predictionsToday) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {selectedTab === 'models' && (
            <motion.div
              key="models"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid gap-6">
                {models.map((model) => (
                  <div key={model.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {getModelTypeIcon(model.type)}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{model.name}</h3>
                          <p className="text-sm text-gray-600">
                            Last updated: {model.lastUpdated.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          model.status === 'active' ? 'bg-green-100 text-green-800' :
                          model.status === 'training' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {model.status}
                        </span>
                        {model.id === activeModel && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            Active
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-600">Accuracy</div>
                        <div className="text-lg font-semibold text-green-600">{model.accuracy.toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Confidence</div>
                        <div className="text-lg font-semibold">{Math.round(model.confidence * 100)}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Training Data</div>
                        <div className="text-lg font-semibold">{model.trainingData.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Features</div>
                        <div className="text-lg font-semibold">{model.features.length}</div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="text-sm text-gray-600 mb-2">Features:</div>
                      <div className="flex flex-wrap gap-2">
                        {model.features.map((feature) => (
                          <span 
                            key={feature}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setActiveModel(model.id)}
                        disabled={model.id === activeModel}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {model.id === activeModel ? 'Currently Active' : 'Set Active'}
                      </button>
                      <button
                        onClick={() => handleModelRetrain(model.id)}
                        disabled={isTraining}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Retrain
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {selectedTab === 'analytics' && mlMetrics && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Feature Importance Chart */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Importance</h3>
                <Plot
                  data={[
                    {
                      x: mlMetrics.featureImportance.map(f => f.importance),
                      y: mlMetrics.featureImportance.map(f => f.feature),
                      type: 'bar',
                      orientation: 'h',
                      marker: {
                        color: mlMetrics.featureImportance.map(f => {
                          switch (f.trend) {
                            case 'increasing': return '#10b981';
                            case 'decreasing': return '#ef4444';
                            default: return '#6b7280';
                          }
                        })
                      }
                    }
                  ]}
                  layout={{
                    title: 'Model Feature Importance',
                    xaxis: { title: 'Importance Score' },
                    yaxis: { title: 'Features' },
                    height: 400,
                    margin: { l: 150, r: 50, t: 50, b: 50 }
                  }}
                  config={{ responsive: true }}
                />
              </div>

              {/* Performance Trends */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
                <Plot
                  data={[
                    {
                      x: Array.from({ length: 24 }, (_, i) => `${i}:00`),
                      y: Array.from({ length: 24 }, () => 85 + Math.random() * 15),
                      type: 'scatter',
                      mode: 'lines+markers',
                      name: 'Accuracy',
                      line: { color: '#3b82f6' }
                    },
                    {
                      x: Array.from({ length: 24 }, (_, i) => `${i}:00`),
                      y: Array.from({ length: 24 }, () => 80 + Math.random() * 15),
                      type: 'scatter',
                      mode: 'lines+markers',
                      name: 'Confidence',
                      line: { color: '#10b981' }
                    }
                  ]}
                  layout={{
                    title: '24-Hour Performance Overview',
                    xaxis: { title: 'Hour of Day' },
                    yaxis: { title: 'Performance %', range: [70, 100] },
                    height: 400
                  }}
                  config={{ responsive: true }}
                />
              </div>
            </motion.div>
          )}

          {selectedTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Engine Configuration</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prediction Update Interval
                    </label>
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                      <option value="10">10 seconds</option>
                      <option value="30" selected>30 seconds</option>
                      <option value="60">1 minute</option>
                      <option value="300">5 minutes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confidence Threshold
                    </label>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="1" 
                      step="0.05" 
                      defaultValue="0.8"
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                      <span>50%</span>
                      <span>80%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Auto-Retrain Models
                    </label>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm text-gray-600">
                        Automatically retrain models when accuracy drops below threshold
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      External Data Sources
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm text-gray-600">Weather API Integration</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm text-gray-600">Traffic API Integration</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm text-gray-600">Events API Integration</span>
                      </div>
                    </div>
                  </div>

                  <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                    Save Settings
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}