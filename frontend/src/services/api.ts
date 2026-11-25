import type {
  IntentConstraints,
  TripItinerary,
  Place,
  PlaceReviewAnalysis,
  RouteLeg,
  ReportOptions
} from '../types';

const API_BASE = '/api';

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Failed to fetch health');
    return res.json();
  },

  async extractIntent(prompt: string): Promise<IntentConstraints> {
    const res = await fetch(`${API_BASE}/intent/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to extract intent');
    }
    return res.json();
  },

  async searchPlaces(query: string, destination?: string | null): Promise<Place[]> {
    const res = await fetch(`${API_BASE}/places/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, destination })
    });
    if (!res.ok) throw new Error('Failed to search places');
    const data = await res.json();
    return data.places;
  },

  async getPlaceReviews(placeId: string): Promise<PlaceReviewAnalysis> {
    const res = await fetch(`${API_BASE}/places/${placeId}/reviews`);
    if (!res.ok) throw new Error('Failed to fetch reviews');
    return res.json();
  },

  async computeRoute(originId: string, destinationId: string, travelMode: string): Promise<RouteLeg> {
    const res = await fetch(`${API_BASE}/routes/compute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin_id: originId, destination_id: destinationId, travel_mode: travelMode })
    });
    if (!res.ok) throw new Error('Failed to compute route');
    const data = await res.json();
    return data.route;
  },

  async generateTrip(
    prompt: string = '',
    constraints?: IntentConstraints | null,
    selectedPlaceIds?: string[],
    sourceLocation?: string,
    destination?: string,
    sourceLat?: number | null,
    sourceLng?: number | null
  ): Promise<TripItinerary> {
    const res = await fetch(`${API_BASE}/trips/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: prompt || (destination ? `Trip from ${sourceLocation || 'Current Location'} to ${destination}` : ''),
        source_location: sourceLocation,
        destination: destination,
        constraints,
        selected_place_ids: selectedPlaceIds,
        source_lat: sourceLat,
        source_lng: sourceLng
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to generate trip');
    }
    return res.json();
  },

  async recalculateTrip(trip: TripItinerary, newTransportMode?: string): Promise<TripItinerary> {
    const res = await fetch(`${API_BASE}/trips/recalculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trip,
        new_transport_mode: newTransportMode
      })
    });
    if (!res.ok) throw new Error('Failed to recalculate trip');
    return res.json();
  },

  async downloadReportPdf(trip: TripItinerary, options: ReportOptions): Promise<Blob> {
    const res = await fetch(`${API_BASE}/reports/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trip, options })
    });
    if (!res.ok) throw new Error('Failed to generate PDF report');
    return res.blob();
  },

  async chatWithAssistant(
    message: string,
    tripContext?: any,
    history?: { role: string; content: string }[]
  ): Promise<{ reply: string; suggested_followups: string[]; source: string }> {
    const res = await fetch(`${API_BASE}/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        trip_context: tripContext,
        history
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Assistant service is temporarily unavailable');
    }
    return res.json();
  }
};
