import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { X } from 'lucide-react';

const AD_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
const AD_DURATION = 15; // seconds to watch ad

export const AdProvider = ({ children }) => {
    const [showAd, setShowAd] = useState(false);
    const [countdown, setCountdown] = useState(AD_DURATION);
    const [canSkip, setCanSkip] = useState(false);

    const closeAd = useCallback(() => {
        setShowAd(false);
        setCountdown(AD_DURATION);
        setCanSkip(false);
    }, []);

    // Timer to show ad every 5 minutes
    useEffect(() => {
        const interval = setInterval(() => {
            setShowAd(true);
        }, AD_INTERVAL);

        return () => clearInterval(interval);
    }, []);

    // Countdown timer when ad is showing
    useEffect(() => {
        if (!showAd) return;

        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    setCanSkip(true);
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [showAd]);

    return (
        <>
            {children}
            
            <Dialog open={showAd} onOpenChange={() => {}}>
                <DialogContent 
                    className="sm:max-w-xl p-0 overflow-hidden rounded-2xl border-0"
                    hideClose
                >
                    <div className="relative">
                        {/* Ad Header */}
                        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
                            <span className="text-xs font-medium bg-black/60 text-white px-3 py-1 rounded-full backdrop-blur-sm">
                                Advertisement
                            </span>
                            {canSkip ? (
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={closeAd}
                                    className="rounded-full h-8 px-4 bg-white/90 hover:bg-white text-black"
                                    data-testid="skip-ad-btn"
                                >
                                    Skip Ad <X className="w-3 h-3 ml-1" />
                                </Button>
                            ) : (
                                <span className="text-xs font-medium bg-black/60 text-white px-3 py-1 rounded-full backdrop-blur-sm">
                                    Skip in {countdown}s
                                </span>
                            )}
                        </div>

                        {/* Ad Content - Placeholder for Google AdSense */}
                        <div className="aspect-video bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center">
                            <div className="text-center text-white p-8">
                                {/* 
                                  Replace this div with your Google AdSense code:
                                  <ins class="adsbygoogle"
                                       style="display:block"
                                       data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
                                       data-ad-slot="XXXXXXXXXX"
                                       data-ad-format="auto"
                                       data-full-width-responsive="true"></ins>
                                */}
                                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                                    <span className="text-4xl font-bold">Ad</span>
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Your Ad Here</h3>
                                <p className="text-sm text-white/80 max-w-xs mx-auto">
                                    Connect Google AdSense to display real ads and earn revenue
                                </p>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="p-4 bg-card">
                            <Progress 
                                value={((AD_DURATION - countdown) / AD_DURATION) * 100} 
                                className="h-1"
                            />
                            <p className="text-xs text-muted-foreground mt-2 text-center">
                                Thanks for supporting Ideæ! Ads help keep the service free.
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default AdProvider;
