import {
  Alert,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material"
import { memo, useCallback, useMemo, useState } from "react"
import { useController, useForm } from "react-hook-form"
import { LazyTreeView, type TreeNode } from "../../common/FileTreeView"
import { errorToHelperText } from "../../common/forms/errorToHelperText"
import { ConnectorSelector } from "../../connectors/ConnectorSelector"
import { isCancelError } from "../../errors/errors.shared"
import type { SynologyDriveDataSourceDocType } from "@oboku/shared"
import type { SynologyDriveSession } from "./client"
import { useRequestSynologyDriveSession } from "./auth/auth"
import {
  collectSelectedNodes,
  countSelectedNodesByType,
  isSynologyDriveBrowseNodeId,
  toSelectedTreeItemIds,
  type SynologyTreeNode,
} from "./browsing/tree"
import { useSelectionTreeData } from "./browsing/useSelectionTreeData"
import { DataSourceFormLayout } from "../DataSourceFormLayout"
import type { DataSourceFormData, DataSourceFormInternalProps } from "../types"

type SynologyDriveFormData = DataSourceFormData<{
  connectorId: string
  items: string[]
}>

export const DataSourceForm = memo(
  ({
    dataSource,
    onSubmit,
    submitLabel,
  }: DataSourceFormInternalProps<SynologyDriveDataSourceDocType>) => {
    const { control, handleSubmit } = useForm<SynologyDriveFormData>({
      mode: "onChange",
      defaultValues: {
        name: dataSource?.name ?? "",
        tags: [...(dataSource?.tags ?? [])],
        connectorId: dataSource?.data_v2?.connectorId ?? "",
        items: [...(dataSource?.data_v2?.items ?? [])],
      },
    })
    const requestSynologyDriveSession = useRequestSynologyDriveSession()
    const [session, setSession] = useState<SynologyDriveSession | undefined>(
      undefined,
    )
    const [selectionPrefetchItemIds, setSelectionPrefetchItemIds] = useState<
      string[]
    >([])
    const [connectError, setConnectError] = useState<Error | undefined>(
      undefined,
    )
    const [isConnecting, setIsConnecting] = useState(false)
    const [tree, setTree] = useState<SynologyTreeNode[]>([])
    const { field: connectorField, fieldState: connectorFieldState } =
      useController({
        control,
        name: "connectorId",
        rules: { required: true },
      })
    const { field: itemsField } = useController({
      control,
      name: "items",
      rules: { required: false },
    })

    const connectorId = connectorField.value
    const selectedItemIds = useMemo(
      () => itemsField.value ?? [],
      [itemsField.value],
    )
    const selectedTreeItemIds = useMemo(
      () => toSelectedTreeItemIds(selectedItemIds),
      [selectedItemIds],
    )
    const selectedNodes = useMemo(
      () => collectSelectedNodes(tree, new Set(selectedTreeItemIds)),
      [selectedTreeItemIds, tree],
    )
    const selectedCounts = useMemo(
      () => countSelectedNodesByType(selectedNodes),
      [selectedNodes],
    )
    const {
      initialExpandedItems,
      isSelectedItemsPrefetchLoading,
      isTreeLoading,
      onLoadChildren,
      treeError,
      treeItems,
    } = useSelectionTreeData({
      connectorId,
      prefetchedSelectedItemIds: selectionPrefetchItemIds,
      session,
    })

    const handleConnectorChange = (
      value: Parameters<NonNullable<typeof connectorField.onChange>>[0],
    ) => {
      setSession(undefined)
      setSelectionPrefetchItemIds([])
      setConnectError(undefined)
      itemsField.onChange([])
      setTree([])
      connectorField.onChange(value)
    }

    const handleConnect = async () => {
      if (!connectorId) {
        return
      }

      setIsConnecting(true)
      setConnectError(undefined)

      try {
        setSelectionPrefetchItemIds(selectedItemIds)
        const nextSession = await requestSynologyDriveSession({
          connectorId,
          forceRefresh: !!session,
        })

        setSession(nextSession)
      } catch (error) {
        setSession(undefined)
        setSelectionPrefetchItemIds([])
        if (!isCancelError(error)) {
          setConnectError(
            error instanceof Error ? error : new Error(String(error)),
          )
        }
      } finally {
        setIsConnecting(false)
      }
    }

    const browserError: Error | undefined = connectError ?? treeError
    const handleTreeChange = useCallback((nextTree: TreeNode[]) => {
      const typedTree = nextTree.filter((item): item is SynologyTreeNode =>
        isSynologyDriveBrowseNodeId(item.id),
      )

      setTree((prev) => (prev === typedTree ? prev : typedTree))
    }, [])

    return (
      <DataSourceFormLayout
        control={control}
        onSubmit={handleSubmit((data) =>
          onSubmit({
            name: data.name,
            tags: data.tags,
            data_v2: { connectorId: data.connectorId, items: data.items },
          }),
        )}
        submitLabel={submitLabel}
      >
        <ConnectorSelector
          {...connectorField}
          connectorType="synology-drive"
          onChange={(event) => handleConnectorChange(event)}
          helperText={
            connectorFieldState.invalid
              ? errorToHelperText(connectorFieldState.error)
              : undefined
          }
          error={connectorFieldState.invalid}
        />
        <Typography variant="subtitle2">Items to synchronize</Typography>
        <Button
          disabled={!connectorId}
          loading={isConnecting}
          onClick={() => {
            void handleConnect()
          }}
          variant="outlined"
        >
          {session ? "Reconnect" : "Connect"}
        </Button>
        <Typography color="text.secondary" variant="body2">
          {selectedNodes.length > 0
            ? `${selectedCounts.folders} folders, ${selectedCounts.files} files selected`
            : `${selectedItemIds.length} selected`}
        </Typography>
        {browserError ? (
          <Alert severity="error">{String(browserError)}</Alert>
        ) : session && (isTreeLoading || isSelectedItemsPrefetchLoading) ? (
          <Stack alignItems="center" justifyContent="center" py={6}>
            <CircularProgress />
          </Stack>
        ) : session ? (
          <LazyTreeView
            initialExpandedItems={initialExpandedItems}
            initialItems={treeItems}
            isItemSelectionDisabled={(item) =>
              item.id.startsWith("root:") || item.label.length === 0
            }
            onLoadChildren={onLoadChildren}
            onSelectedItemsChange={(_event, itemIds) => {
              itemsField.onChange(
                collectSelectedNodes(tree, new Set(itemIds))
                  .map((node) => node.fileId)
                  .filter(
                    (value): value is string => typeof value === "string",
                  ),
              )
            }}
            onTreeChange={handleTreeChange}
            selectedItems={selectedTreeItemIds}
          />
        ) : null}
        {connectorFieldState.invalid && (
          <Typography color="error" variant="caption">
            {errorToHelperText(connectorFieldState.error)}
          </Typography>
        )}
      </DataSourceFormLayout>
    )
  },
)
