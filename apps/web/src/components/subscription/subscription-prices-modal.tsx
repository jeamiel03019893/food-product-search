'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PriceCard } from './price-card';
import { CancelConfirmDialog } from './cancel-confirm-dialog';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { useAuth } from '@/hooks/use-auth';
import { usePrices } from '@/hooks/use-prices';
import { useCheckout } from '@/hooks/use-checkout';
import { useSwitchSubscription } from '@/hooks/use-switch-subscription';
import { useCancelSubscription } from '@/hooks/use-cancel-subscription';
import { useTranslation } from '@/i18n/language-provider';

interface SubscriptionPricesModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

// Either the user picked a different plan while already subscribed
// (switch: cancel current, then checkout the new one) or asked to
// cancel outright (no new subscription) — one confirm dialog serves
// both, distinguished by this pending action's `type`.
type PendingAction = { type: 'switch'; priceId: string } | { type: 'cancel' } | null;

export const SubscriptionPricesModal = ({
	open,
	onOpenChange,
}: SubscriptionPricesModalProps) => {
	const { t } = useTranslation();
	const { data: auth } = useAuth();
	const { data: prices, isLoading, isError } = usePrices();
	const checkout = useCheckout();
	const switchSubscription = useSwitchSubscription();
	const cancelSubscription = useCancelSubscription();
	const [pendingAction, setPendingAction] = useState<PendingAction>(null);

	const isSubscribed = auth?.hasActiveSubscription ?? false;
	const currentPriceId = auth?.currentPriceId ?? null;
	const isBusy =
		checkout.isPending || switchSubscription.isPending || cancelSubscription.isPending;

	const handleSelect = (priceId: string) => {
		if (isSubscribed) {
			onOpenChange(false);
			setPendingAction({ type: 'switch', priceId });
			return;
		}

		toast.promise(checkout.mutateAsync(priceId), {
			loading: t('subscription.toastRedirecting'),
			error: (err: Error) => err.message || t('subscription.toastCheckoutError'),
		});
	};

	const handleCancelSubscription = () => {
		onOpenChange(false);
		setPendingAction({ type: 'cancel' });
	};

	const handleConfirmAction = () => {
		if (!pendingAction) return;

		if (pendingAction.type === 'switch') {
			toast.promise(switchSubscription.mutateAsync(pendingAction.priceId), {
				loading: t('subscription.toastSwitching'),
				error: (err: Error) => err.message || t('subscription.toastSwitchError'),
			});
		} else {
			toast.promise(cancelSubscription.mutateAsync(), {
				loading: t('subscription.toastCancelling'),
				error: (err: Error) => err.message || t('subscription.toastCancelError'),
			});
		}

		setPendingAction(null);
	};

	return (
		<>
			<Dialog
				open={open && !isBusy}
				onOpenChange={onOpenChange}
			>
				<DialogContent className='sm:max-w-2xl'>
					<DialogHeader>
						<DialogTitle>{t('subscription.modalTitle')}</DialogTitle>
						<DialogDescription>
							{isSubscribed
								? t('subscription.modalDescriptionSubscribed')
								: t('subscription.modalDescriptionUnsubscribed')}
						</DialogDescription>
					</DialogHeader>

					{isLoading && (
						<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
							<Skeleton className='h-48' />
							<Skeleton className='h-48' />
						</div>
					)}

					{isError && (
						<p className='text-sm text-destructive'>
							{t('subscription.loadError')}
						</p>
					)}

					{prices && prices.length === 0 && (
						<p className='text-sm text-muted-foreground'>
							{t('subscription.noPlans')}
						</p>
					)}

					{prices && prices.length > 0 && (
						<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
							{prices.map((price) => (
								<PriceCard
									key={price.id}
									price={price}
									disabled={isBusy || price.id === currentPriceId}
									buttonLabel={
										price.id === currentPriceId
											? t('subscription.currentPlan')
											: isSubscribed
												? t('subscription.switchPlan')
												: t('subscription.subscribe')
									}
									onSelect={() => handleSelect(price.id)}
								/>
							))}
						</div>
					)}

					{isSubscribed && (
						<Button
							type='button'
							variant='ghost'
							className='text-destructive hover:text-destructive'
							disabled={isBusy}
							onClick={handleCancelSubscription}
						>
							{t('subscription.cancelSubscription')}
						</Button>
					)}
				</DialogContent>
			</Dialog>

			<CancelConfirmDialog
				open={pendingAction !== null}
				pending={switchSubscription.isPending || cancelSubscription.isPending}
				title={
					pendingAction?.type === 'cancel'
						? t('subscription.cancelConfirmTitle')
						: t('subscription.confirmTitle')
				}
				description={
					pendingAction?.type === 'cancel'
						? t('subscription.cancelConfirmDescription')
						: t('subscription.confirmDescription')
				}
				cancelLabel={
					pendingAction?.type === 'cancel'
						? t('subscription.keepSubscription')
						: t('subscription.keepPlan')
				}
				confirmLabel={
					pendingAction?.type === 'cancel'
						? t('subscription.confirmCancel')
						: t('subscription.confirmSwitch')
				}
				pendingLabel={
					pendingAction?.type === 'cancel'
						? t('subscription.cancellingInProgress')
						: t('subscription.switchingInProgress')
				}
				onCancel={() => setPendingAction(null)}
				onConfirm={handleConfirmAction}
			/>

			{isBusy && !cancelSubscription.isPending && (
				<LoadingOverlay message={t('subscription.overlayMessage')} />
			)}
		</>
	);
};
