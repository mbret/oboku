import {
  Alert,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material"
import { memo, useCallback, useMemo, useState } from "react"
import type { Control, UseFormWatch } from "react-hook-form"
import { useController } from "react-hook-form"
import { LazyTreeView, type TreeNode } from "../../common/FileTreeView"
import { errorToHelperText } from "../../common/forms/errorToHelperText"
import { ConnectorSelector } from "../../connectors/ConnectorSelector"
import { isCancelError } from "../../errors/errors.shared"
import type { DataSourceFormData } from "../types"
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

export const DataSourceForm = memo(
  ({
    control,
    watch,
  }: {
    control: Control<DataSourceFormData, unknown, DataSourceFormData>
    watch: UseFormWatch<DataSourceFormData>
  }) => {
    watch("data")
    const requestSynologyDriveSession = useRequestSynologyDriveSession()
    const [session, setSession] = useState<SynologyDriveSession | undefined>(
      undefined,
    )
    const [connectError, setConnectError] = useState<Error | undefined>(
      undefined,
    )
    const [isConnecting, setIsConnecting] = useState(false)
    const [tree, setTree] = useState<SynologyTreeNode[]>([])
    const { field: connectorField, fieldState: connectorFieldState } =
      useController({
        control,
        name: "data.connectorId",
        rules: { required: true },
      })
    const { field: itemsField } = useController({
      control,
      name: "data.items",
      rules: { required: false },
    })

    const connectorId =
      typeof connectorField.value === "string" ? connectorField.value : ""
    const selectedItemIds = useMemo(
      () =>
        Array.isArray(itemsField.value)
          ? itemsField.value.filter(
              (value): value is string => typeof value === "string",
            )
          : [],
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
      selectedItemIds,
      session,
    })

    const handleConnectorChange = (
      value: Parameters<NonNullable<typeof connectorField.onChange>>[0],
    ) => {
      setSession(undefined)
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
        const nextSession = await requestSynologyDriveSession({
          connectorId,
          forceRefresh: !!session,
        })

        setSession(nextSession)
      } catch (error) {
        setSession(undefined)
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
      <Stack gap={2}>
        <ConnectorSelector
          {...connectorField}
          connectorType="synology-drive"
          showManagementButtons={false}
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
      </Stack>
    )
  },
)
