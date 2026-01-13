import { useState, useEffect } from "react";
import {
  RegionData,
  CitySlot,
  TradableResource,
  ResourceTradeOffer,
  ResourceTradeDeal,
} from "@/game/types";
import { PhaserGameRef } from "@/game/PhaserGame";
import { X, ArrowRightLeft, TrendingUp, TrendingDown, Check, XCircle } from "lucide-react";
import { toast } from "sonner";

interface TradeMenuProps {
  gameRef: React.RefObject<PhaserGameRef>;
  onClose: () => void;
}

/**
 * TradeMenu - Resource trading UI for inter-city trade
 *
 * Features:
 * - View available trade offers from other cities
 * - Create new trade offers
 * - Accept trade offers
 * - View and cancel active trade deals
 */
export function TradeMenu({ gameRef, onClose }: TradeMenuProps) {
  const [regionData, setRegionData] = useState<RegionData | null>(null);
  const [activeCity, setActiveCity] = useState<CitySlot | null>(null);
  const [selectedTab, setSelectedTab] = useState<"offers" | "deals" | "create">("offers");

  // Create offer state
  const [offerResource, setOfferResource] = useState<TradableResource>(TradableResource.Power);
  const [offerAmount, setOfferAmount] = useState<number>(100);
  const [requestResource, setRequestResource] = useState<TradableResource>(TradableResource.Water);
  const [requestAmount, setRequestAmount] = useState<number>(100);

  // Load data
  useEffect(() => {
    const loadData = () => {
      const scene = gameRef.current?.scene;
      if (!scene) return;

      const regionSystem = scene.getRegionSystem();
      if (!regionSystem) return;

      const data = regionSystem.getRegionData();
      const city = regionSystem.getActiveCity();
      setRegionData(data);
      setActiveCity(city);
    };

    loadData();

    // Listen for trade updates
    const scene = gameRef.current?.scene;
    if (scene) {
      scene.events.on("trade:offerCreated", loadData);
      scene.events.on("trade:dealActivated", loadData);
      scene.events.on("trade:dealCancelled", loadData);
      scene.events.on("trade:dealCompleted", loadData);

      return () => {
        scene.events.off("trade:offerCreated", loadData);
        scene.events.off("trade:dealActivated", loadData);
        scene.events.off("trade:dealCancelled", loadData);
        scene.events.off("trade:dealCompleted", loadData);
      };
    }
  }, [gameRef]);

  if (!regionData || !activeCity) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div
          className="w-[500px] p-6 text-center"
          style={{
            background: "linear-gradient(180deg, hsl(120 15% 8%) 0%, hsl(120 10% 5%) 100%)",
            border: "2px solid",
            borderColor: "hsl(120 35% 22%) hsl(120 20% 10%) hsl(120 20% 10%) hsl(120 35% 22%)",
            boxShadow: "0 0 30px hsl(120 100% 50% / 0.2)",
          }}
        >
          <p style={{ color: "hsl(120 60% 50%)" }}>No active city or region found.</p>
          <button onClick={onClose} className="mt-4 px-4 py-2" style={{ color: "hsl(120 100% 70%)" }}>
            Close
          </button>
        </div>
      </div>
    );
  }

  const tradeOffers = regionData.tradeOffers.filter((o) => o.fromCityId !== activeCity.id);
  const myOffers = regionData.tradeOffers.filter((o) => o.fromCityId === activeCity.id);
  const activeDeals = regionData.activeDeals.filter(
    (d) => d.exporterCityId === activeCity.id || d.importerCityId === activeCity.id
  );

  // Get resource icon
  const getResourceIcon = (resource: TradableResource): string => {
    const icons: Record<TradableResource, string> = {
      [TradableResource.Power]: "⚡",
      [TradableResource.Water]: "💧",
      [TradableResource.Scrap]: "⚙",
      [TradableResource.Food]: "🌾",
      [TradableResource.Medicine]: "✚",
      [TradableResource.Caps]: "◎",
    };
    return icons[resource];
  };

  // Get resource color
  const getResourceColor = (resource: TradableResource): string => {
    const colors: Record<TradableResource, string> = {
      [TradableResource.Power]: "hsl(50 100% 60%)",
      [TradableResource.Water]: "hsl(180 70% 50%)",
      [TradableResource.Scrap]: "hsl(120 40% 50%)",
      [TradableResource.Food]: "hsl(45 80% 55%)",
      [TradableResource.Medicine]: "hsl(0 70% 55%)",
      [TradableResource.Caps]: "hsl(120 60% 55%)",
    };
    return colors[resource];
  };

  // Get city name
  const getCityName = (cityId: string): string => {
    const city = regionData.cities.find((c) => c.id === cityId);
    return city?.name || "Unknown City";
  };

  // Handle create offer
  const handleCreateOffer = () => {
    const scene = gameRef.current?.scene;
    if (!scene) return;

    const regionSystem = scene.getRegionSystem();
    if (!regionSystem) return;

    try {
      regionSystem.createTradeOffer({
        fromCityId: activeCity.id,
        offeredResource: offerResource,
        offeredAmount: offerAmount,
        requestedResource: requestResource,
        requestedAmount: requestAmount,
      });
      toast.success("Trade offer created!");
      setSelectedTab("offers");
    } catch (error: any) {
      toast.error("Failed to create offer", {
        description: error.message,
      });
    }
  };

  // Handle accept offer
  const handleAcceptOffer = (offerId: string) => {
    const scene = gameRef.current?.scene;
    if (!scene) return;

    const regionSystem = scene.getRegionSystem();
    if (!regionSystem) return;

    const deal = regionSystem.acceptTradeOffer(offerId);
    if (deal) {
      toast.success("Trade deal accepted!");
    } else {
      toast.error("Failed to accept offer");
    }
  };

  // Handle cancel deal
  const handleCancelDeal = (dealId: string) => {
    const scene = gameRef.current?.scene;
    if (!scene) return;

    const regionSystem = scene.getRegionSystem();
    if (!regionSystem) return;

    regionSystem.cancelTradeDeal(dealId);
    toast.success("Trade deal cancelled");
  };

  // Format numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div
        className="w-[800px] max-h-[90vh] overflow-hidden flex flex-col"
        style={{
          background: "linear-gradient(180deg, hsl(120 15% 8%) 0%, hsl(120 10% 5%) 100%)",
          border: "2px solid",
          borderColor: "hsl(120 35% 22%) hsl(120 20% 10%) hsl(120 20% 10%) hsl(120 35% 22%)",
          boxShadow: "0 0 30px hsl(120 100% 50% / 0.2), inset 0 0 40px hsl(120 100% 50% / 0.03)",
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between border-b-2"
          style={{
            borderColor: "hsl(120 30% 15%)",
            background: "hsl(120 15% 6%)",
          }}
        >
          <div className="flex items-center gap-3">
            <ArrowRightLeft size={24} style={{ color: "hsl(120 100% 70%)" }} />
            <div>
              <h2
                className="text-xl font-bold tracking-wider"
                style={{ color: "hsl(120 100% 70%)", textShadow: "0 0 10px hsl(120 100% 50% / 0.5)" }}
              >
                INTER-CITY TRADE
              </h2>
              <p className="text-xs mt-1" style={{ color: "hsl(120 60% 50%)" }}>
                {activeCity.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5" style={{ color: "hsl(120 60% 50%)" }}>
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div
          className="flex border-b-2"
          style={{
            borderColor: "hsl(120 30% 15%)",
            background: "hsl(120 12% 7%)",
          }}
        >
          {[
            { id: "offers" as const, label: "Available Offers", count: tradeOffers.length },
            { id: "deals" as const, label: "Active Deals", count: activeDeals.length },
            { id: "create" as const, label: "Create Offer", count: myOffers.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className="px-6 py-3 text-sm font-bold tracking-wide transition-all"
              style={{
                background: selectedTab === tab.id ? "hsl(120 20% 12%)" : "transparent",
                color: selectedTab === tab.id ? "hsl(120 100% 70%)" : "hsl(120 50% 45%)",
                borderBottom: selectedTab === tab.id ? "2px solid hsl(120 60% 40%)" : "none",
                textShadow: selectedTab === tab.id ? "0 0 8px hsl(120 100% 50% / 0.3)" : "none",
              }}
            >
              {tab.label} {tab.count > 0 && `(${tab.count})`}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Available Offers Tab */}
          {selectedTab === "offers" && (
            <div className="space-y-3">
              {tradeOffers.length === 0 ? (
                <div className="text-center py-12" style={{ color: "hsl(120 50% 40%)" }}>
                  <p>No trade offers available.</p>
                  <p className="text-xs mt-2">Create an offer to start trading with other cities.</p>
                </div>
              ) : (
                tradeOffers.map((offer) => (
                  <div
                    key={offer.id}
                    className="p-4 flex items-center gap-4"
                    style={{
                      background: "hsl(120 15% 10%)",
                      border: "1px solid hsl(120 30% 20%)",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                    }}
                  >
                    {/* From City */}
                    <div className="flex-1">
                      <p className="text-xs mb-2" style={{ color: "hsl(120 50% 40%)" }}>
                        From: {getCityName(offer.fromCityId)}
                      </p>
                      <div className="flex items-center gap-2">
                        <TrendingDown size={16} style={{ color: "hsl(0 70% 55%)" }} />
                        <span className="text-lg" style={{ color: getResourceColor(offer.offeredResource) }}>
                          {getResourceIcon(offer.offeredResource)}
                        </span>
                        <span className="font-bold" style={{ color: "hsl(120 80% 60%)" }}>
                          {formatNumber(offer.offeredAmount)}
                        </span>
                        <span className="text-xs" style={{ color: "hsl(120 60% 50%)" }}>
                          {offer.offeredResource}
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ArrowRightLeft size={24} style={{ color: "hsl(120 50% 40%)" }} />

                    {/* Requested */}
                    <div className="flex-1">
                      <p className="text-xs mb-2" style={{ color: "hsl(120 50% 40%)" }}>
                        For:
                      </p>
                      <div className="flex items-center gap-2">
                        <TrendingUp size={16} style={{ color: "hsl(120 70% 50%)" }} />
                        <span className="text-lg" style={{ color: getResourceColor(offer.requestedResource) }}>
                          {getResourceIcon(offer.requestedResource)}
                        </span>
                        <span className="font-bold" style={{ color: "hsl(120 80% 60%)" }}>
                          {formatNumber(offer.requestedAmount)}
                        </span>
                        <span className="text-xs" style={{ color: "hsl(120 60% 50%)" }}>
                          {offer.requestedResource}
                        </span>
                      </div>
                    </div>

                    {/* Accept Button */}
                    <button
                      onClick={() => handleAcceptOffer(offer.id)}
                      className="px-4 py-2 font-bold text-sm tracking-wide flex items-center gap-2"
                      style={{
                        background: "hsl(120 30% 15%)",
                        border: "1px solid hsl(120 50% 35%)",
                        color: "hsl(120 100% 70%)",
                        boxShadow: "0 0 10px hsl(120 100% 50% / 0.2)",
                      }}
                    >
                      <Check size={16} />
                      ACCEPT
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Active Deals Tab */}
          {selectedTab === "deals" && (
            <div className="space-y-3">
              {activeDeals.length === 0 ? (
                <div className="text-center py-12" style={{ color: "hsl(120 50% 40%)" }}>
                  <p>No active trade deals.</p>
                  <p className="text-xs mt-2">Accept offers to establish regular trade routes.</p>
                </div>
              ) : (
                activeDeals.map((deal) => {
                  const isExporter = deal.exporterCityId === activeCity.id;
                  return (
                    <div
                      key={deal.id}
                      className="p-4"
                      style={{
                        background: "hsl(120 15% 10%)",
                        border: "1px solid hsl(120 40% 25%)",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3), 0 0 15px hsl(120 100% 50% / 0.1)",
                      }}
                    >
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex-1">
                          <p className="text-xs mb-1" style={{ color: "hsl(120 50% 40%)" }}>
                            {isExporter ? "Exporting to" : "Importing from"}:{" "}
                            {getCityName(isExporter ? deal.importerCityId : deal.exporterCityId)}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-lg" style={{ color: getResourceColor(deal.resource) }}>
                              {getResourceIcon(deal.resource)}
                            </span>
                            <span className="font-bold" style={{ color: "hsl(120 80% 60%)" }}>
                              {formatNumber(deal.amountPerMonth)}/month
                            </span>
                            <span className="text-xs" style={{ color: "hsl(120 60% 50%)" }}>
                              {deal.resource}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-xs mb-1" style={{ color: "hsl(120 50% 40%)" }}>
                            Duration
                          </p>
                          <p className="font-bold text-sm" style={{ color: "hsl(120 80% 60%)" }}>
                            {deal.duration} months
                          </p>
                        </div>

                        <button
                          onClick={() => handleCancelDeal(deal.id)}
                          className="px-3 py-2 text-xs font-bold flex items-center gap-1"
                          style={{
                            background: "hsl(0 30% 15%)",
                            border: "1px solid hsl(0 50% 35%)",
                            color: "hsl(0 80% 60%)",
                          }}
                        >
                          <XCircle size={14} />
                          CANCEL
                        </button>
                      </div>

                      {/* Progress Bar */}
                      <div
                        className="h-1 relative overflow-hidden"
                        style={{
                          background: "hsl(120 20% 8%)",
                          border: "1px solid hsl(120 30% 15%)",
                        }}
                      >
                        <div
                          className="h-full transition-all"
                          style={{
                            width: `${(deal.monthsRemaining / deal.duration) * 100}%`,
                            background: "hsl(120 60% 40%)",
                            boxShadow: "0 0 8px hsl(120 100% 50% / 0.4)",
                          }}
                        />
                      </div>
                      <p className="text-[10px] mt-1 text-right" style={{ color: "hsl(120 50% 40%)" }}>
                        {deal.monthsRemaining} months remaining
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Create Offer Tab */}
          {selectedTab === "create" && (
            <div className="space-y-6">
              {/* My Active Offers */}
              {myOffers.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold mb-3" style={{ color: "hsl(120 100% 70%)" }}>
                    MY ACTIVE OFFERS ({myOffers.length})
                  </h3>
                  <div className="space-y-2">
                    {myOffers.map((offer) => (
                      <div
                        key={offer.id}
                        className="p-3 text-sm"
                        style={{
                          background: "hsl(120 12% 8%)",
                          border: "1px solid hsl(120 25% 18%)",
                        }}
                      >
                        Offering {formatNumber(offer.offeredAmount)} {offer.offeredResource} for{" "}
                        {formatNumber(offer.requestedAmount)} {offer.requestedResource}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Create New Offer */}
              <div>
                <h3 className="text-sm font-bold mb-4" style={{ color: "hsl(120 100% 70%)" }}>
                  CREATE NEW OFFER
                </h3>

                {/* Offering */}
                <div className="mb-4">
                  <label className="text-xs block mb-2" style={{ color: "hsl(120 60% 50%)" }}>
                    I WILL EXPORT:
                  </label>
                  <div className="flex gap-3">
                    <select
                      value={offerResource}
                      onChange={(e) => setOfferResource(e.target.value as TradableResource)}
                      className="flex-1 px-3 py-2 font-mono text-sm"
                      style={{
                        background: "hsl(120 15% 10%)",
                        border: "1px solid hsl(120 30% 20%)",
                        color: "hsl(120 80% 60%)",
                      }}
                    >
                      {Object.values(TradableResource).map((res) => (
                        <option key={res} value={res}>
                          {getResourceIcon(res)} {res}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={offerAmount}
                      onChange={(e) => setOfferAmount(Number(e.target.value))}
                      min="1"
                      step="10"
                      className="w-32 px-3 py-2 font-mono text-sm"
                      style={{
                        background: "hsl(120 15% 10%)",
                        border: "1px solid hsl(120 30% 20%)",
                        color: "hsl(120 80% 60%)",
                      }}
                    />
                  </div>
                </div>

                {/* Requesting */}
                <div className="mb-6">
                  <label className="text-xs block mb-2" style={{ color: "hsl(120 60% 50%)" }}>
                    IN EXCHANGE FOR:
                  </label>
                  <div className="flex gap-3">
                    <select
                      value={requestResource}
                      onChange={(e) => setRequestResource(e.target.value as TradableResource)}
                      className="flex-1 px-3 py-2 font-mono text-sm"
                      style={{
                        background: "hsl(120 15% 10%)",
                        border: "1px solid hsl(120 30% 20%)",
                        color: "hsl(120 80% 60%)",
                      }}
                    >
                      {Object.values(TradableResource).map((res) => (
                        <option key={res} value={res}>
                          {getResourceIcon(res)} {res}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={requestAmount}
                      onChange={(e) => setRequestAmount(Number(e.target.value))}
                      min="1"
                      step="10"
                      className="w-32 px-3 py-2 font-mono text-sm"
                      style={{
                        background: "hsl(120 15% 10%)",
                        border: "1px solid hsl(120 30% 20%)",
                        color: "hsl(120 80% 60%)",
                      }}
                    />
                  </div>
                </div>

                {/* Create Button */}
                <button
                  onClick={handleCreateOffer}
                  className="w-full py-3 font-bold tracking-wider"
                  style={{
                    background: "hsl(120 25% 15%)",
                    border: "2px solid hsl(120 50% 35%)",
                    color: "hsl(120 100% 70%)",
                    boxShadow: "0 0 15px hsl(120 100% 50% / 0.2)",
                  }}
                >
                  CREATE TRADE OFFER
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
