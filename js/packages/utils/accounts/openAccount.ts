import { Platform } from 'react-native'

import beapi from '@berty/api'
import { setStreamProgress, setStreamError, setStreamDone } from '@berty/redux/reducers/ui.reducer'
import { AppDispatch, persistor } from '@berty/redux/store'
import { accountClient, storageGet } from '@berty/utils/accounts/accountClient'
import { defaultCLIArgs } from '@berty/utils/accounts/defaultCLIArgs'
import { defaultGlobalPersistentOptions } from '@berty/utils/global-persistent-options/defaults'
import { GlobalPersistentOptionsKeys } from '@berty/utils/global-persistent-options/types'
import { StreamProgressType } from '@berty/utils/protocol/progress.types'

const openAccountWithProgress = async (
	cliArgs: string[],
	selectedAccount: string | null,
	dispatch: AppDispatch,
) =>
	new Promise<void>(async (resolve, reject) => {
		try {
			const logFilters =
				(await storageGet(GlobalPersistentOptionsKeys.LogFilters)) ||
				defaultGlobalPersistentOptions().logFilters.format
			console.info(`logFilters=${logFilters}`)

			const stream = await accountClient.openAccountWithProgress({
				args: cliArgs,
				accountId: selectedAccount?.toString(),
				sessionKind: Platform.OS === 'web' ? 'desktop-electron' : null,
				loggerFilters: logFilters,
			})
			stream.onMessage((msg, err) => {
				if (err?.EOF) {
					console.log('activating persist with account:', selectedAccount?.toString())
					persistor.persist()
					console.log('opening account: stream closed')
					dispatch(setStreamDone())
					resolve()
				} else if (err && !err.OK) {
					console.warn('open account error:', err.error.errorCode)
					dispatch(setStreamError({ error: new Error(`Failed to start node: ${err}`) }))
					reject(err)
				}
				if (msg?.progress?.state !== 'done') {
					const progress = msg?.progress
					if (progress) {
						const payload: StreamProgressType = {
							msg: progress,
							stream: 'Open account',
						}
						dispatch(setStreamProgress(payload))
					}
				}
			})
			await stream.start()
			console.log('node is opened')
		} catch (err) {
			dispatch(setStreamError({ error: new Error(`Failed to start node: ${err}`) }))
			reject(err)
		}
	})

export const openAccount = async (selectedAccount: string | null, dispatch: AppDispatch) => {
	if (selectedAccount === null) {
		console.warn('no account opened')
		return
	}

	const cliArgs = defaultCLIArgs

	try {
		const tyberHost = (await storageGet(GlobalPersistentOptionsKeys.TyberHost)) || ''
		if (tyberHost !== '') {
			// TODO: need to add this Tyber flag before enable this
			// PR: https://github.com/berty/berty/pull/3877
			// console.info(`connecting to ${tyberHost}`)
			// cliArgs.push('--log.tyber-auto-attach=' + tyberHost)
		}
	} catch (e) {
		console.warn(e)
	}

	let openedAccount: beapi.account.GetOpenedAccount.Reply

	openedAccount = await accountClient.getOpenedAccount({})

	if (openedAccount.accountId !== selectedAccount) {
		if (openedAccount.accountId !== '') {
			await accountClient.closeAccount({})
		}

		await openAccountWithProgress(cliArgs, selectedAccount, dispatch)
	}
}
