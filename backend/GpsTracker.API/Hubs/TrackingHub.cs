using Microsoft.AspNetCore.SignalR;

namespace GpsTracker.API.Hubs;

public class TrackingHub : Hub
{
    public async Task JoinDeviceGroup(int deviceId)
        => await Groups.AddToGroupAsync(Context.ConnectionId, $"device-{deviceId}");

    public async Task LeaveDeviceGroup(int deviceId)
        => await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"device-{deviceId}");

    public override async Task OnConnectedAsync()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "all-devices");
        await base.OnConnectedAsync();
    }
}
